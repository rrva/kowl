import { observable, autorun } from "mobx";
import { touch, assignDeep } from "../utils/utils";
import { TopicDetailsSettings } from "./uiState";
import { DEFAULT_TABLE_PAGE_SIZE } from "../components/common";

const settingsName = 'uiSettings';


/*
	todo:
	- remember UI settings using local storage
	- topic: message filter, display settings, ...
*/


export interface PreviewTag {
    value: string;
    active: boolean;
}

const uiSettings = observable({
    sideBarOpen: true,
    selectedClusterIndex: 0,
    allTopicsDetails: new Map<string, TopicDetailsSettings>(),

    brokers: {
        hideEmptyColumns: false,
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
    },

    topics: {
        onlyShowChanged: false,
        valueDisplay: 'friendly' as 'friendly' | 'both' | 'raw',
        hideInternalTopics: true,
        previewTags: [] as PreviewTag[],
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
    },

    topicMessages: {
        pageSize: 20,
    },

    consumerGroups: {
        pageSize: DEFAULT_TABLE_PAGE_SIZE,
    },

    previewNotificationHideUntil: 0, // utc seconds
});
export { uiSettings };



//
// Settings save/load

// Load settings
let storedSettingsJson = localStorage.getItem(settingsName);
if (storedSettingsJson) {
    const loadedSettings = JSON.parse(storedSettingsJson);
    assignDeep(uiSettings, loadedSettings);
}

// Auto save (timed)
autorun(() => {
    touch(uiSettings);
    const json = JSON.stringify(uiSettings);
    localStorage.setItem(settingsName, json);
    //console.log('settings: ' + json);
}, { delay: 1000 });

// Auto save (on exit)
window.addEventListener('beforeunload', () => {
    const json = JSON.stringify(uiSettings);
    localStorage.setItem(settingsName, json);
    //console.log('settings (unload): ' + json);
});
