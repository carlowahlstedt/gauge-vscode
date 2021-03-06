'use strict';

import { window, workspace, debug } from 'vscode';
import getPort = require('get-port');
import { isDotnetProject } from '../util';

const GAUGE_DEBUGGER_NAME = "Gauge Debugger";
const REQUEST_TYPE = "attach";
const DEBUG_PORT = 'debugPort';

export class GaugeDebugger {

    private debugPort: number;
    private languageId: string;
    private projectRoot: string;
    private debug: boolean;
    private dotnetProcessID: number;

    constructor(clientLanguageMap: Map<string, string>, config: any) {
        this.languageId = clientLanguageMap.get(config.projectRoot);
        this.projectRoot = config.projectRoot;
        this.debug = config.debug;
    }

    private setDebuggerConf(): any {
        switch (this.languageId) {
            case "python": {
                return {
                    type: "python",
                    name: GAUGE_DEBUGGER_NAME,
                    request: REQUEST_TYPE,
                    port: this.debugPort,
                    localRoot: this.projectRoot
                };
            }

            case "javascript": {
                return {
                    type: "node",
                    name: GAUGE_DEBUGGER_NAME,
                    request: REQUEST_TYPE,
                    port: this.debugPort,
                    protocol: "inspector"
                };
            }

            case "ruby": {
                return {
                    name: GAUGE_DEBUGGER_NAME,
                    type: "Ruby",
                    request: REQUEST_TYPE,
                    cwd: this.projectRoot,
                    remoteWorkspaceRoot: this.projectRoot,
                    remoteHost: "127.0.0.1",
                    remotePort: this.debugPort
                };
            }
            case "csharp": {
                return {
                    name: GAUGE_DEBUGGER_NAME,
                    type: "coreclr",
                    request: REQUEST_TYPE,
                    processId: this.dotnetProcessID,
                    justMyCode: true
                };
            }
        }
    }

    addProcessId(pid: number): any {
        this.dotnetProcessID = pid;
    }

    public addDebugEnv(projectRoot: string): Thenable<any> {
        let env = Object.create(process.env);
        if (this.debug) {
            env.DEBUGGING = true;
            return getPort({ port: DEBUG_PORT }).then((port) => {
                if (isDotnetProject(projectRoot)) env.GAUGE_CSHARP_PROJECT_CONFIG = "Debug";
                env.DEBUG_PORT = port;
                this.debugPort = port;
                return env;
            });
        } else {
            return Promise.resolve(env);
        }
    }

    public startDebugger(): void {
        debug.startDebugging(workspace.getWorkspaceFolder(window.activeTextEditor.document.uri),
        this.setDebuggerConf());
    }

    public stopDebugger(): void {
        if (debug.activeDebugSession) {
            debug.activeDebugSession.customRequest("disconnect");
        }
    }

}