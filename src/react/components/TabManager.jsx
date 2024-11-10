import * as React from 'react';
import {useEffect, useState} from 'react';

import {SupportedLanguages} from "../../contants/Enums.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons/faPlusSquare";
import {faRectangleTimes} from "@fortawesome/free-regular-svg-icons/faRectangleTimes";
import {faFileText} from "@fortawesome/free-regular-svg-icons";
import Editor from "./Editor.jsx";

const DEFAULT_TAB_NAME = "New Document.txt";

let currentTabs = [];

export function TabManager() {
    const [tabs, setTabs] = useState(currentTabs);
    const [selectedTab, setSelectedTab] = useState(tabs[0]);
    const [editorData, setEditorData] = useState({
        length: 0,
        lineCount: 1,
        selection: {
            selectionLength: 0
        }
    });

    const selectTab = (data) => {
        if(data.tab?.id === selectedTab?.id) return;

        setSelectedTab(data.tab)
    };

    const addTab = ({isTemp, name, file, content}) => {
        const tabId = crypto.randomUUID();

        const tab = {
            id: tabId,
            name: generateUniqueName(name || DEFAULT_TAB_NAME),
            file: file,
            content: content,
            isTemp: isTemp
        };

        tab.displayName = tab.name.length > 20 ? tab.name.substring(0, 20) + "..." : tab.name;

        setTabs([...tabs, tab]);
        setSelectedTab(tab);
    }

    const removeTab = (event, data) => {
        if(data.tab === selectedTab) {
            if(tabs.length === 1) setSelectedTab(null);
            else setSelectedTab(tabs[tabs.indexOf(data.tab)-1]);
        }

        setTabs(tabs.filter(t => t !== data.tab));

        event.stopPropagation();
    }

    const handleChange = (content) => {
        selectedTab.content = content;
    }

    const handleStatistics = (data) => {
        const newMetadata = {
            length: selectedTab?.content?.length,
            lineCount: data.lineCount,
            selection: {
                selectionLength: data.selectedText ? data.selections.map(sel => sel.length).reduce((previous, current) => previous + current, 0) : 0
            }
        };

        if(JSON.stringify(editorData) !== JSON.stringify(newMetadata)) setEditorData(newMetadata); // sometimes this causing an infinite loop
    }

    document.getElementById(selectedTab?.id)?.scrollIntoView(); // if a newly created tab is not in view area, scroll it!

    useEffect(() => {
        currentTabs = tabs;
    }, [tabs]);

    useEffect(() => {
        addTab({isTemp: true});
    }, []);

    window.ApplicationEvents.onTabOpen((event, data) =>  {
        addTab(data);
    });

    return (
        <div id={"tabManager"}>
            <div id={"tabListWrapper"}>
                <div id={"tabList"}>
                    { tabs && tabs.length > 0 &&
                        tabs.map(tab => (
                            <div id={tab.id} key={tab.id} className={"editorTabHeader" + (tab.id === selectedTab?.id ? " selected" : "")} onClick={() => selectTab({tab})}>
                                <div>
                                    <FontAwesomeIcon icon={faFileText}/>
                                    <span className={"tabHeaderName"} style={{marginLeft: "5px"}} title={tab.fileName || tab.name}>{tab.displayName}</span>
                                </div>
                                <div>
                                    <FontAwesomeIcon className={"closeTabButton"} icon={faRectangleTimes} onClick={(e) => removeTab(e, {tab})}/>
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div id={"newTabPanel"}>
                    <FontAwesomeIcon icon={faPlusSquare} className={"iconButton"} onClick={() => addTab({isTemp: true})}/>
                </div>
            </div>

            <div id={"tabContent"}>
                {selectedTab &&
                    <Editor key={selectedTab.id}
                        language={SupportedLanguages.findByFileName(selectedTab.file)}
                        content={selectedTab.content}
                        changeListener={(val, viewUpdate) => handleChange(val, viewUpdate)}
                        statisticListener={(data) => handleStatistics(data)}
                    />
                }
            </div>

            <div id={"footer"}>
                <div id={"footerLeft"}>
                    {selectedTab?.file}
                </div>
                { editorData &&
                    <div id={"footerRight"}>
                        <label className={"editorDataLabel"}>
                            length: <span className={"editorDataContent"}>{editorData.length}</span>
                        </label>
                        <label className={"editorDataLabel"}>
                            lines: <span className={"editorDataContent"}>{editorData.lineCount}</span>
                        </label>
                        <label className={"editorDataLabel"}>
                            selection: <span className={"editorDataContent"}>{editorData.selection?.selectionLength}</span>
                        </label>
                    </div>
                }
            </div>
        </div>
    );
}

function generateUniqueName(initialName) {
    let count = 0;

    let generatedName = initialName;

    while(containsWithName(generatedName)) {
        count ++;
        generatedName = `${initialName} (${count})`;
    }

    return generatedName;
}

function containsWithName(name) {
    return currentTabs.filter(tab => tab.name === name).length > 0;
}