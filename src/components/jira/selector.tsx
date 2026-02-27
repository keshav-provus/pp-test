"use client";

import { useMemo, useState, useEffect } from "react";
// Removed unused: FiLayers, FiCalendar, FiFileText, FiChevronLeft
import { FiSearch } from "react-icons/fi";
import { Table, TableCard } from "@/components/application/table/table";
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

    return (
        <TableCard.Root className="flex flex-col min-h-125 h-full">
            <TableCard.Header
                title={
                    step === "boards" ? "Select Boards" :
                    step === "sprints" ? "Select Sprints" : "Select Issues"
                }
                badge={`${getSelectedSet().size} selected`}
                contentTrailing={
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="relative w-full sm:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 bg-secondary border border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring transition-colors"
                            />
                        </div>
                        <button 
                            onClick={step === "boards" ? proceedToSprints : step === "sprints" ? proceedToIssues : () => onFinalSelection(issues.filter(i => selectedIssueIds.has(i.id)))}
                            disabled={loading || getSelectedSet().size === 0}
                            className="bg-primary-solid hover:bg-primary-solid_hover text-fg-white px-4 h-9 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"
                        >
                            {loading ? "Loading..." : step === "issues" ? "Import" : "Next Step"}
                        </button>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto">
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
                        <Table.Head id="key" label="Key / ID" isRowHeader className="w-1/4" />
                        <Table.Head id="summary" label="Name / Summary" />
                        {step === "issues" && <Table.Head id="priority" label="Priority" />}
                        <Table.Head id="status" label="Status" />
                        {step === "issues" && <Table.Head id="assignee" label="Assignee" />}
                    </Table.Header>
                    
                    <Table.Body items={filteredItems}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(item: any) => (
                            <Table.Row id={item.id}>
                                <Table.Cell>
                                    <span className="font-medium text-brand">
                                        {('key' in item && item.key) || `#${item.id}`}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    <span className="font-medium text-primary">
                                        {('name' in item && item.name) || ('summary' in item && item.summary)}
                                    </span>
                                </Table.Cell>
                                {step === "issues" && (
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {item.priorityIconUrl && <img src={item.priorityIconUrl} alt="" className="w-4 h-4" />}
                                            <span className="text-secondary">{item.priority || "Normal"}</span>
                                        </div>
                                    </Table.Cell>
                                )}
                                <Table.Cell>
                                    <Badge color="gray" size="sm">
                                        {('type' in item && item.type) || ('state' in item && item.state) || ('status' in item && item.status)}
                                    </Badge>
                                </Table.Cell>
                                {step === "issues" && (
                                    <Table.Cell>
                                        {item.assignee ? (
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-6 w-6">
                                                    {item.assigneeAvatarUrl && <AvatarImage src={item.assigneeAvatarUrl} />}
                                                    <AvatarFallback>{item.assignee.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium text-primary">{item.assignee}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-tertiary italic">Unassigned</span>
                                        )}
                                    </Table.Cell>
                                )}
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                
                {filteredItems.length === 0 && !loading && (
                    <div className="p-8 text-center text-tertiary">
                        No items found.
                    </div>
                )}
            </div>
        </TableCard.Root>
    );
};