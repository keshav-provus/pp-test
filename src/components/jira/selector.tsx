"use client";

import { useMemo, useState, useEffect } from "react";
// Removed unused: FiLayers, FiCalendar, FiFileText, FiChevronLeft
import { FiSearch, FiChevronRight } from "react-icons/fi";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { type JiraBoard, type JiraSprint, type JiraIssue, getBoardData, getSprints, getIssuesBySprint } from "@/services/jira";

type Step = "boards" | "sprints" | "issues";

interface JiraMultiSelectorProps {
  onFinalSelection: (issues: JiraIssue[]) => void;
  // Removed unused onCancel from destructuring to silence warning if you don't intend to use it inside this specific component yet
}

export const JiraMultiSelector = ({ onFinalSelection }: JiraMultiSelectorProps) => {
    // ... all states and functions remain the same
    const [step, setStep] = useState<Step>("boards");
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [boards, setBoards] = useState<JiraBoard[]>([]);
    const [sprints, setSprints] = useState<JiraSprint[]>([]);
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    
    const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());
    const [selectedSprintIds, setSelectedSprintIds] = useState<Set<string>>(new Set());
    const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const data = await getBoardData();
                if (isMounted) setBoards(data);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, []);

    const proceedToSprints = async () => {
        setLoading(true);
        try {
            const allSprints = await Promise.all(Array.from(selectedBoardIds).map(id => getSprints(id)));
            setSprints(allSprints.flat());
            setStep("sprints");
            setSearchQuery("");
        } finally {
            setLoading(false);
        }
    };

    const proceedToIssues = async () => {
        setLoading(true);
        try {
            const allIssues = await Promise.all(Array.from(selectedSprintIds).map(id => getIssuesBySprint(id)));
            setIssues(allIssues.flat());
            setStep("issues");
            setSearchQuery("");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        const items = step === "boards" ? boards : step === "sprints" ? sprints : issues;
        return items.filter(item => {
            const text = ((item as JiraBoard).name || (item as JiraIssue).summary || (item as JiraIssue).key || "").toLowerCase();
            return text.includes(searchQuery.toLowerCase());
        });
    }, [step, boards, sprints, issues, searchQuery]);

 

    const getSelectedSet = () => step === "boards" ? selectedBoardIds : step === "sprints" ? selectedSprintIds : selectedIssueIds;

    const steps = [
        { id: "boards", label: "Select Boards" },
        { id: "sprints", label: "Select Sprints" },
        { id: "issues", label: "Select Issues" },
    ];

    return (
        // FIX: Swapped min-h-[500px] for canonical min-h-125
        <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#2c333a] rounded-md shadow-sm flex flex-col min-h-125">
            {/* ... rest of the render tree remains exactly the same ... */}
            
            {/* Header / Breadcrumbs */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2c333a] bg-[#f4f5f7] dark:bg-[#111214]">
                <div className="flex items-center gap-2">
                    {steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${step === s.id ? "text-[#0052cc] dark:text-[#4c9aff]" : "text-gray-500 dark:text-[#8c9bab]"}`}>
                                {s.label}
                            </span>
                            {idx < steps.length - 1 && <FiChevronRight className="text-gray-400" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-[#2c333a]">
                <div className="relative w-72">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-gray-50 dark:bg-[#22272b] border border-gray-200 dark:border-[#8c9bab]/30 rounded text-sm focus:outline-none focus:border-[#0052cc] transition-colors"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{getSelectedSet().size} selected</span>
                    <button 
                        onClick={step === "boards" ? proceedToSprints : step === "sprints" ? proceedToIssues : () => onFinalSelection(issues.filter(i => selectedIssueIds.has(i.id)))}
                        disabled={loading || getSelectedSet().size === 0}
                        className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 h-9 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Loading..." : step === "issues" ? "Import to Session" : "Next Step"}
                    </button>
                </div>
            </div>

            {/* Clean Table List */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111214]">
                <Table 
                    aria-label="Jira Items"
                    selectionMode="multiple"
                    selectedKeys={getSelectedSet()}
                    onSelectionChange={(keys) => {
                        const updateState = step === "boards" ? setSelectedBoardIds : step === "sprints" ? setSelectedSprintIds : setSelectedIssueIds;
                        if (keys === "all") {
                            updateState(new Set(filteredItems.map(i => i.id)));
                        } else {
                            updateState(new Set(keys as Iterable<string>));
                        }
                    }}
                    className="w-full text-left"
                >
                    <Table.Header>
                        <Table.Head id="key" isRowHeader>Key / ID</Table.Head>
                        <Table.Head id="summary">Name / Summary</Table.Head>
                        {step === "issues" && <Table.Head id="priority">Priority</Table.Head>}
                        <Table.Head id="status">Status</Table.Head>
                        {step === "issues" && <Table.Head id="assignee">Assignee</Table.Head>}
                    </Table.Header>
                    <Table.Body items={filteredItems}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(item: any) => (
                            <Table.Row id={item.id}>
                                <Table.Cell>
                                    <span className="font-medium text-[#0052cc] dark:text-[#4c9aff]">
                                        {('key' in item && item.key) || `#${item.id}`}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="text-[#172b4d] dark:text-[#b6c2cf] font-medium">
                                        {('name' in item && item.name) || ('summary' in item && item.summary)}
                                    </span>
                                </Table.Cell>
                                {step === "issues" && (
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {item.priorityIconUrl && <img src={item.priorityIconUrl} alt="" className="w-4 h-4" />}
                                            <span className="text-gray-600 dark:text-gray-400">{item.priority || "Normal"}</span>
                                        </div>
                                    </Table.Cell>
                                )}
                                <Table.Cell>
                                    <Badge color="gray" size="sm" className="uppercase font-semibold tracking-wider">
                                        {('type' in item && item.type) || ('state' in item && item.state) || ('status' in item && item.status)}
                                    </Badge>
                                </Table.Cell>
                                {step === "issues" && (
                                    <Table.Cell>
                                        {item.assignee ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    {item.assigneeAvatarUrl && <AvatarImage src={item.assigneeAvatarUrl} />}
                                                    <AvatarFallback>{item.assignee.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-gray-700 dark:text-gray-300">{item.assignee}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Unassigned</span>
                                        )}
                                    </Table.Cell>
                                )}
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                
                {filteredItems.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                        No items found.
                    </div>
                )}
            </div>
        </div>
    );
};