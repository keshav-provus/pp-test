"use client";

import { useMemo, useState, useEffect } from "react";
// Removed unused: FiLayers, FiCalendar, FiFileText, FiChevronLeft
import { FiSearch } from "react-icons/fi";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { type JiraBoard, type JiraSprint, type JiraIssue, getBoardData, getSprints, getIssuesBySprint, getIssuesByJql } from "@/services/jira";
import { JqlEditor } from "./jql-editor";

interface JiraMultiSelectorProps {
  onFinalSelection: (issues: JiraIssue[]) => void;
  // Removed unused onCancel from destructuring to silence warning if you don't intend to use it inside this specific component yet
}

export const JiraMultiSelector = ({ onFinalSelection }: JiraMultiSelectorProps) => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Data states
    const [boards, setBoards] = useState<JiraBoard[]>([]);
    const [sprints, setSprints] = useState<JiraSprint[]>([]);
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    
    // Filter states
    const [selectedBoardId, setSelectedBoardId] = useState<string>("");
    const [selectedSprintId, setSelectedSprintId] = useState<string>("");
    
    // JQL Mode State
    const [isJqlMode, setIsJqlMode] = useState(false);
    const [jqlQuery, setJqlQuery] = useState("");

    // Selection state
    const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());

    // Initial load of boards
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const data = await getBoardData();
                if (isMounted) {
                    setBoards(data);
                    if (data.length > 0) {
                        setSelectedBoardId(data[0].id);
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, []);

    // Load sprints when board changes
    useEffect(() => {
        if (!selectedBoardId) return;
        let isMounted = true;
        
        const loadSprints = async () => {
            setLoading(true);
            try {
                const data = await getSprints(selectedBoardId);
                if (isMounted) {
                    setSprints(data);
                    if (data.length > 0) {
                        setSelectedSprintId(data[0].id);
                    } else {
                        setSelectedSprintId("");
                        setIssues([]);
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadSprints();
        return () => { isMounted = false; };
    }, [selectedBoardId]);

    // Load issues when sprint changes
    useEffect(() => {
        if (!selectedSprintId) return;
        let isMounted = true;
        
        const loadIssues = async () => {
            setLoading(true);
            try {
                const data = await getIssuesBySprint(selectedSprintId);
                if (isMounted) {
                    setIssues(data);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadIssues();
        return () => { isMounted = false; };
    }, [selectedSprintId]);

    const filteredIssues = useMemo(() => {
        if (isJqlMode) return issues; // In JQL mode, the API handles the filtering
        
        return issues.filter(item => {
            const text = (item.summary || item.key || "").toLowerCase();
            return text.includes(searchQuery.toLowerCase());
        });
    }, [issues, searchQuery, isJqlMode]);

    const handleJqlSearch = async () => {
        if (!jqlQuery.trim()) return;
        setLoading(true);
        try {
            const data = await getIssuesByJql(jqlQuery);
            setIssues(data);
        } catch (err) {
            console.error("JQL Search Failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSelected = () => {
        const selectedIssues = issues.filter(i => selectedIssueIds.has(i.id));
        onFinalSelection(selectedIssues);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1d2125]">
            {/* Header / Filters Bar */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-[#2c333a] flex-wrap">
                {isJqlMode ? (
                    <>
                        <div className="flex-1 w-full min-w-[300px]">
                            <JqlEditor 
                                value={jqlQuery} 
                                onChange={setJqlQuery} 
                                onSearch={handleJqlSearch}
                            />
                        </div>
                        <button 
                            onClick={handleJqlSearch}
                            className="h-9 px-4 bg-[#0052cc] hover:bg-[#0047b3] text-white rounded text-sm font-medium transition-colors"
                        >
                            Search
                        </button>
                        <button 
                            onClick={() => {
                                setIsJqlMode(false);
                                setJqlQuery("");
                            }}
                            className="h-9 px-3 bg-gray-50 dark:bg-[#22272b] border border-gray-200 dark:border-[#8c9bab]/30 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                            Basic
                        </button>
                    </>
                ) : (
                    <>
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Issue name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 bg-white dark:bg-[#22272b] border border-gray-200 dark:border-[#8c9bab]/30 rounded text-sm focus:outline-none focus:border-[#0052cc] transition-colors"
                            />
                        </div>
                        
                        <select 
                            value={selectedBoardId} 
                            onChange={e => setSelectedBoardId(e.target.value)}
                            className="h-9 px-3 bg-[#e9f2ff] text-[#0052cc] dark:bg-[#1d2a3d] dark:text-[#4c9aff] border-none rounded text-sm font-medium focus:outline-none cursor-pointer"
                        >
                            <option value="" disabled>Project</option>
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        <select 
                            value={selectedSprintId} 
                            onChange={e => setSelectedSprintId(e.target.value)}
                            className="h-9 px-3 bg-gray-100 dark:bg-[#22272b] border border-gray-200 dark:border-[#8c9bab]/30 rounded text-sm font-medium focus:outline-none cursor-pointer max-w-[200px] truncate"
                        >
                            <option value="" disabled>Sprint</option>
                            {sprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        <div className="flex-1" />

                        <button 
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedIssueIds(new Set());
                            }}
                            className="h-9 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c333a] rounded transition-colors flex items-center gap-1"
                        >
                            <span className="text-gray-400">⊗</span> Clear
                        </button>
                        
                        <button 
                            onClick={() => setIsJqlMode(true)}
                            className="h-9 px-3 bg-gray-50 dark:bg-[#22272b] border border-gray-200 dark:border-[#8c9bab]/30 rounded text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            JQL
                        </button>
                    </>
                )}
            </div>
            
            <div className="px-4 py-2 bg-white dark:bg-[#1d2125]">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {loading ? "Loading..." : `${filteredIssues.length} issues loaded`}
                </span>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <Table 
                    aria-label="Jira Issues"
                    selectionMode="multiple"
                    selectedKeys={selectedIssueIds}
                    onSelectionChange={(keys) => {
                        if (keys === "all") {
                            setSelectedIssueIds(new Set(filteredIssues.map(i => i.id)));
                        } else {
                            setSelectedIssueIds(new Set(keys as Iterable<string>));
                        }
                    }}
                    className="w-full text-left border border-gray-200 dark:border-[#2c333a] rounded-t-md"
                >
                    <Table.Header className="bg-white dark:bg-[#1d2125] border-b-2 border-gray-100 dark:border-[#2c333a]">
                        <Table.Head id="type" label="T" className="w-[40px] px-2 text-gray-500 font-semibold text-xs" />
                        <Table.Head id="key" label="Key" isRowHeader className="w-[100px] px-2 text-gray-500 font-semibold text-xs" />
                        <Table.Head id="summary" label="Summary" className="px-2 text-gray-500 font-semibold text-xs" />
                        <Table.Head id="epic" label="Epic" className="w-[140px] px-2 text-gray-500 font-semibold text-xs" />
                        <Table.Head id="status" label="Status" className="w-[100px] px-2 text-gray-500 font-semibold text-xs" />
                        <Table.Head id="estimate" label="Estimate" className="w-[80px] px-2 text-gray-500 font-semibold text-xs" />
                        <Table.Head id="priority" label="P" className="w-[40px] px-2 text-gray-500 font-semibold text-xs" />
                        <Table.Head id="assignee" label="Assignee" className="w-[120px] px-2 text-gray-500 font-semibold text-xs" />
                    </Table.Header>
                    
                    <Table.Body items={filteredIssues}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(item: any) => (
                            <Table.Row id={item.id} className="border-b border-gray-100 dark:border-[#2c333a] hover:bg-gray-50 dark:hover:bg-[#22272b] transition-colors">
                                <Table.Cell className="px-2 py-3">
                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-green-100 text-green-700 text-xs font-bold">
                                        ☑
                                    </div>
                                </Table.Cell>
                                <Table.Cell className="px-2 py-3">
                                    <span className="font-medium text-[#0052cc] dark:text-[#4c9aff] hover:underline cursor-pointer text-sm">
                                        {item.key}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="px-2 py-3">
                                    <span className="text-[#172b4d] dark:text-[#b6c2cf] text-sm">
                                        {item.summary}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="px-2 py-3">
                                    <span className="text-gray-400 text-sm">-</span>
                                </Table.Cell>
                                <Table.Cell className="px-2 py-3">
                                    <Badge color="gray" size="sm" className="uppercase font-bold tracking-wider text-[10px] bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 border-none">
                                        {item.statusCategory || item.status || "OPEN"}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell className="px-2 py-3">
                                    <span className="text-gray-500 text-sm">-</span>
                                </Table.Cell>
                                <Table.Cell className="px-2 py-3">
                                    {item.priorityIconUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.priorityIconUrl} alt="Priority" className="w-4 h-4" />
                                    ) : (
                                        <span className="text-red-500 font-bold text-lg leading-none">^</span>
                                    )}
                                </Table.Cell>
                                <Table.Cell className="px-2 py-3">
                                    {item.assignee ? (
                                        <Avatar className="h-6 w-6">
                                            {item.assigneeAvatarUrl && <AvatarImage src={item.assigneeAvatarUrl} />}
                                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{item.assignee.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <span className="text-gray-400 text-sm"></span>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-[#2c333a] flex items-center justify-end gap-3 bg-white dark:bg-[#1d2125]">
                <button 
                    onClick={() => onFinalSelection([])}
                    className="px-4 h-9 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c333a] rounded transition-colors"
                >
                    Close
                </button>
                <button 
                    onClick={handleAddSelected}
                    disabled={selectedIssueIds.size === 0 || loading}
                    className="bg-[#0052cc] hover:bg-[#0047b3] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 h-9 rounded text-sm font-medium transition-colors"
                >
                    Add {selectedIssueIds.size} issue(s)
                </button>
            </div>
        </div>
    );
};