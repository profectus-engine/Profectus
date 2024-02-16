/**
 * The Galaxy API defines actions and responses for interacting with the Galaxy platform.
 *
 * @typedef {object} SupportsAction
 * @property {"supports"} action - The action type.
 * @property {boolean} saving - If your game auto-saves or allows the user to make/load game saves from within the UI.
 * @property {boolean} save_manager - If your game has a complete save manager integrated into it.
 */

/**
 * The save list action sends a retrieval request to Galaxy to get the player's cloud save list.
 *
 * @typedef {object} SaveListAction
 * @property {"save_list"} action - The action type.
 */

/**
 * The save action creates a cloud save and puts it into a certain save slot.
 *
 * @typedef {object} SaveAction
 * @property {"save"} action - The action type.
 * @property {number} slot - The save slot number. Must be an integer between 0 and 10, inclusive.
 * @property {string} [label] - The optional label of the save file.
 * @property {string} data - The actual save data.
 */

/**
 * The load action sends a retrieval request to Galaxy to get the cloud save data inside a certain save slot.
 *
 * @typedef {object} LoadAction
 * @property {"load"} action - The action type.
 * @property {number} slot - The save slot number.
 */

/**
 * The Galaxy action can be one of SupportsAction, SaveListAction, SaveAction, or LoadAction.
 *
 * @typedef {SupportsAction | SaveListAction | SaveAction | LoadAction} GalaxyAction
 */

/**
 * The info response is sent when the page loads.
 *
 * @typedef {object} InfoResponse
 * @property {"info"} type - The response type.
 * @property {boolean} galaxy - Whether you're talking to Galaxy.
 * @property {number} api_version - The version of the API.
 * @property {string} theme_preference - The player's theme preference.
 * @property {boolean} logged_in - Whether the player is logged in.
 */

/**
 * The save list response is requested by the save_list action.
 *
 * @typedef {object} SaveListResponse
 * @property {"save_list"} type - The response type.
 * @property {Record<number, { label: string; content: string }>} list - A list of saves.
 * @property {boolean} error - Whether the action encountered an error.
 * @property {("no_account" | "server_error")} [message] - Reason for the error.
 */

/**
 * The save content response is requested by the load action.
 *
 * @typedef {object} SaveContentResponse
 * @property {"save_content"} type - The response type.
 * @property {boolean} error - Whether the action encountered an error.
 * @property {("no_account" | "empty_slot" | "invalid_slot" | "server_error")} [message] - Reason for the error.
 * @property {number} slot - The save slot number.
 * @property {string} [label] - The save's label.
 * @property {string} [content] - The save's actual data.
 */

/**
 * The saved response is requested by the save action.
 *
 * @typedef {object} SavedResponse
 * @property {"saved"} type - The response type.
 * @property {boolean} error - Whether the action encountered an error.
 * @property {number} slot - The save slot number.
 * @property {("no_account" | "too_big" | "invalid_slot" | "server_error")} [message] - Reason for the error.
 */

/**
 * The GalaxyResponse can be one of InfoResponse, SaveListResponse, SaveContentResponse, or SavedResponse.
 *
 * @typedef {InfoResponse | SaveListResponse | SaveContentResponse | SavedResponse} GalaxyResponse
 */

/**
 * The GalaxyApi interface defines methods and properties for interacting with the Galaxy platform.
 *
 * @typedef {object} GalaxyApi
 * @property {string[]} acceptedOrigins - Accepted origins.
 * @property {boolean} [supportsSaving] - Whether saving is supported.
 * @property {boolean} [supportsSaveManager] - Whether save manager is supported.
 * @property {boolean} [ignoreApiVersion] - Whether to ignore API version.
 * @property {function(GalaxyApi): void} [onLoggedInChanged] - Function to handle logged in changes.
 * @property {string} origin - Origin of the API.
 * @property {number} apiVersion - Version of the API.
 * @property {boolean} loggedIn - Whether the player is logged in.
 * @property {function(GalaxyAction): void} postMessage - Method to post a message.
 * @property {function(): Promise<Record<number, { label: string; content: string }>>} getSaveList - Method to get the save list.
 * @property {function(number, string, string?): Promise<number>} save - Method to save data.
 * @property {function(number): Promise<{ content: string; label?: string; slot: number }>} load - Method to load data.
 */


/**
 * Initialize the Galaxy API.
 * @param {Object} [options] - An object of options that configure the API
 * @param {string[]} [options.acceptedOrigins] - A list of domains that the API trusts messages from. Defaults to `['https://galaxy.click']`.
 * @param {boolean} [options.supportsSaving] - Indicates to Galaxy that this game supports saving. Defaults to false.
 * @param {boolean} [options.supportsSaveManager] - Indicates to Galaxy that this game supports a saves manager. Defaults to false.
 * @param {boolean} [options.ignoreApiVersion] - Ignores the api_version property received from Galaxy. By default this value is false, meaning if an unknown API version is encountered, the API will fail to initialize.
 * @param {(galaxy: GalaxyApi) => void} [options.onLoggedInChanged] - A callback for when the logged in status of the player changes after the initialization.
 * @returns {Promise<GalaxyApi>}
 */
export function initGalaxy({
    acceptedOrigins,
    supportsSaving,
    supportsSaveManager,
    ignoreApiVersion,
    onLoggedInChanged
}) {
    return new Promise((accept, reject) => {
        acceptedOrigins = acceptedOrigins ?? ["https://galaxy.click"];
        if (acceptedOrigins.includes(window.origin)) {
            // Callbacks to resolve promises
            /** @type function(SaveListResponse["list"]):void */
            let saveListAccept,
                /** @type function(string?):void */
                saveListReject;
            /** @type Record<number, { accept: function(number):void, reject: function(string?):void }> */
            const saveCallbacks = {};
            /** @type Record<number, { accept: function({ content: string; label?: string; slot: number }):void, reject: function(string?):void }> */
            const loadCallbacks = {};

            /** @type GalaxyApi */
            const galaxy = {
                acceptedOrigins,
                supportsSaving,
                supportsSaveManager,
                ignoreApiVersion,
                onLoggedInChanged,
                origin: window.origin,
                apiVersion: 0,
                loggedIn: false,
                postMessage: function (message) {
                    window.top?.postMessage(message, galaxy.origin);
                },
                getSaveList: function () {
                    if (saveListAccept != null || saveListReject != null) {
                        return Promise.reject("save_list action already in progress.");
                    }
                    galaxy.postMessage({ action: "save_list" });
                    return new Promise((accept, reject) => {
                        saveListAccept = accept;
                        saveListReject = reject;
                    });
                },
                save: function (slot, content, label) {
                    if (slot in saveCallbacks) {
                        return Promise.reject(`save action for slot ${slot} already in progress.`);
                    }
                    galaxy.postMessage({ action: "save", slot, content, label });
                    return new Promise((accept, reject) => {
                        saveCallbacks[slot] = { accept, reject };
                    });
                },
                load: function (slot) {
                    if (slot in loadCallbacks) {
                        return Promise.reject(`load action for slot ${slot} already in progress.`);
                    }
                    galaxy.postMessage({ action: "load", slot });
                    return new Promise((accept, reject) => {
                        loadCallbacks[slot] = { accept, reject };
                    });
                }
            };

            window.addEventListener("message", e => {
                if (e.origin === galaxy.origin) {
                    console.log("Received message from Galaxy", e.data);
                    /** @type GalaxyResponse */
                    const data = e.data;

                    switch (data.type) {
                        case "info": {
                            const { galaxy: isGalaxy, api_version, logged_in } = data;
                            // Ignoring isGalaxy check in case other accepted origins send it as false
                            if (api_version !== 1 && galaxy.ignoreApiVersion !== true) {
                                reject(`API version not recognized: ${api_version}`);
                            } else {
                                // Info responses may be sent again if the information gets updated
                                // Specifically, we care if logged_in gets changed
                                // We can use the api_version to determine if this is the first
                                // info response or a new one.
                                const firstInfoResponse = galaxy.apiVersion === 0;
                                galaxy.apiVersion = api_version;
                                galaxy.loggedIn = logged_in;
                                galaxy.origin = e.origin;
                                if (firstInfoResponse) {
                                    accept(galaxy);
                                } else {
                                    galaxy.onLoggedInChanged?.(galaxy);
                                }
                            }
                            break;
                        }
                        case "save_list": {
                            const { list, error, message } = data;
                            if (error === true) {
                                saveListReject(message);
                            } else {
                                saveListAccept(list);
                            }
                            saveListAccept = saveListReject = null;
                            break;
                        }
                        case "save_content": {
                            const { content, label, slot, error, message } = data;
                            if (error === true) {
                                loadCallbacks[slot]?.reject(message);
                            } else {
                                loadCallbacks[slot]?.accept({ slot, content, label });
                            }
                            delete loadCallbacks[slot];
                            break;
                        }
                        case "saved": {
                            const { slot, error, message } = data;
                            if (error === true) {
                                saveCallbacks[slot]?.reject(message);
                            } else {
                                saveCallbacks[slot]?.accept(slot);
                            }
                            delete saveCallbacks[slot];
                            break;
                        }
                    }
                }
            });
        } else {
            reject(`Project is not running on an accepted origin: ${window.origin}`);
        }
    });
}
