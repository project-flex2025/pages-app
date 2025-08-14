"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Sector,
  Cell,
  ResponsiveContainer,
  Label,
  Tooltip,
} from "recharts";

interface TaskManagementData {
  sprints: string[];
  members: string[];
}

interface SprintOption {
  id: string;
  name: string;
}

// Add type definitions
interface StatusDef {
  id: string;
  name: string;
  color?: string;
}

interface SprintDef {
  record_id: string;
  sprint_name?: string;
  task_status?: StatusDef[];
  sprint_completed?: boolean;
}

interface TaskData {
  more_data?: {
    sprint_id?: string;
    task_status?: string;
    assigned_to?: string;
  };
}

interface UserData {
  record_id: string;
  profile_information?: {
    full_name?: string;
  };
}

const TaskSummary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TaskManagementData>({
    sprints: [],
    members: [],
  });
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [sprintOptions, setSprintOptions] = useState<SprintOption[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>("");
  const [statusCounts, setStatusCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [statusDefs, setStatusDefs] = useState<StatusDef[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [taskDistribution, setTaskDistribution] = useState<{
    [key: string]: number;
  }>({});
  const [userDetails, setUserDetails] = useState<{ [userId: string]: string }>(
    {}
  );

  const [activeSprints, setActiveSprints] = useState<SprintDef[]>([]);
  const [completedSprints, setCompletedSprints] = useState<SprintDef[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const metadataRes = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify({
            conditions: [
              {
                field: "feature_name",
                value: "task_management",
                search_type: "exact",
              },
            ],
            combination_type: "and",
            page: 1,
            limit: 10,
            dataset: "features",
          }),
        });
        const metadata = await metadataRes.json();
        const feature = metadata.data?.[0] || {};
        const sprints = feature.sprints || [];
        setData({ sprints, members: feature.members || [] });

        const sprintRes = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify({
            conditions: [
              {
                field: "feature_name",
                value: "sprint_management",
                search_type: "exact",
              },
              {
                combination_type: "or",
                conditions: sprints.map((id: string) => ({
                  field: "record_id",
                  value: id,
                  search_type: "exact",
                })),
              },
            ],
            combination_type: "and",
            page: 1,
            limit: 100,
            dataset: "feature_data",
          }),
        });
        const sprintResult = await sprintRes.json();
        // const sprintOptions =
        //   (sprintResult.data as SprintDef[] | undefined)?.map((s) => ({
        //     id: s.record_id,
        //     name: s.sprint_name || s.record_id,
        //   })) || [];
        // setSprintOptions(sprintOptions);
        const sprintList: SprintDef[] = sprintResult.data || [];

        const active = sprintList.filter((s) => s.sprint_completed !== true);
        const completed = sprintList.filter((s) => s.sprint_completed === true);

        setActiveSprints(active);
        setCompletedSprints(completed);

        // Optional: Populate sprint dropdown with active only
        const sprintOptions = active.map((s) => ({
          id: s.record_id,
          name: s.sprint_name || s.record_id,
        }));
        setSprintOptions(sprintOptions);

        // Optional: auto-select first active sprint
        if (sprintOptions.length) {
          setSelectedSprint(sprintOptions[0].id);
        }

        if (sprintOptions.length) setSelectedSprint(sprintOptions[0].id);

        const taskRes = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify({
            conditions: [
              {
                field: "feature_name",
                value: "task_status_management",
                search_type: "exact",
              },
            ],
            combination_type: "and",
            page: 1,
            limit: 1,
            dataset: "feature_data",
          }),
        });
        const taskData = await taskRes.json();
        setTotalTasks(taskData.total_results || 0);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedSprint) return;

    const fetchChartData = async () => {
      try {
        const [tasksRes, sprintDefRes] = await Promise.all([
          fetch("/api/proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-TYPE": "search",
            },
            body: JSON.stringify({
              conditions: [
                {
                  field: "feature_name",
                  value: "task_status_management",
                  search_type: "exact",
                },
                {
                  field: "more_data.sprint_id",
                  value: selectedSprint,
                  search_type: "exact",
                },
              ],
              combination_type: "and",
              page: 1,
              limit: 100,
              dataset: "feature_data",
            }),
          }).then((res) => res.json()),

          fetch("/api/proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-TYPE": "search",
            },
            body: JSON.stringify({
              conditions: [
                {
                  field: "feature_name",
                  value: "sprint_management",
                  search_type: "exact",
                },
              ],
              combination_type: "and",
              page: 1,
              limit: 10,
              dataset: "feature_data",
            }),
          }).then((res) => res.json()),
        ]);

        const tasks = (tasksRes.data as TaskData[]) || [];
        const sprintDef = (sprintDefRes.data as SprintDef[] | undefined)?.find(
          (s) => s.record_id === selectedSprint
        );
        const statusList = sprintDef?.task_status || [];
        setStatusDefs(statusList);

        const countMap: { [key: string]: number } = {};
        const validIds = new Set(statusList.map((s) => s.id));
        const memberMap: { [key: string]: number } = {};

        tasks.forEach((task) => {
          const id = task.more_data?.task_status;
          if (id && validIds.has(id)) {
            countMap[id] = (countMap[id] || 0) + 1;
          }
          const assignedTo = task.more_data?.assigned_to || "Unassigned";
          memberMap[assignedTo] = (memberMap[assignedTo] || 0) + 1;
        });

        setStatusCounts(countMap);
        setTaskDistribution(memberMap);
      } catch (error) {
        console.error("Error loading chart data", error);
      }
    };

    fetchChartData();
  }, [selectedSprint]);

  // Fetch user details for workload list
  useEffect(() => {
    const userIds = Object.keys(taskDistribution).filter(
      (id) => id !== "Unassigned"
    );
    if (userIds.length === 0) return;
    const fetchUserDetails = async () => {
      try {
        const orConditions = userIds.map((id) => ({
          field: "record_id",
          value: id,
          search_type: "exact",
        }));
        const res = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-TYPE": "search",
          },
          body: JSON.stringify({
            conditions: [
              {
                field: "feature_name",
                value: "user_management",
                search_type: "exact",
              },
              {
                combination_type: "or",
                conditions: orConditions,
              },
            ],
            combination_type: "and",
            page: 1,
            limit: 100,
            dataset: "users",
          }),
        });
        const data = await res.json();
        const details: { [userId: string]: string } = {};
        ((data.data as UserData[]) || []).forEach((user) => {
          details[user.record_id] =
            user.profile_information?.full_name || user.record_id;
        });
        setUserDetails(details);
      } catch (error) {
        console.error("Error fetching user details", error);
      }
    };
    fetchUserDetails();
  }, [taskDistribution]);

  const pieData = statusDefs.map((s) => ({
    name: s.name,
    value: statusCounts[s.id] || 0,
    color: s.color || "#ccc",
  }));
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  const renderActiveShape = (props: unknown) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props as {
        cx: number;
        cy: number;
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
        fill: string;
      };
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    );
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: { name: string; value: number; color: string };
    }>;
  }
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-2 bg-white shadow-sm border rounded">
          <div className="d-flex align-items-center">
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: item.color,
                marginRight: 8,
                borderRadius: 2,
              }}
            />
            <span className="text-dark">
              {item.name} : <strong>{item.value}</strong>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper functions for Team Workload
  const getInitials = (name: string) => {
    if (!name) return "NA";
    const words = name.split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const generateColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 60%, 40%)`;
  };

  const memberDistribution = Object.entries(taskDistribution)
    .map(([userId, count]) => {
      const name =
        userId === "Unassigned" ? "Unassigned" : userDetails[userId] || userId;
      return {
        userId,
        name,
        count,
        initials: getInitials(name),
        color: userId === "Unassigned" ? "#ccc" : generateColorFromName(name),
      };
    })
    .sort((a, b) => b.count - a.count);

  const iconMap: { [key: string]: string } = {
    "Active Sprints": "fa-solid fa-arrows-rotate",
    "Completed Sprints": "fa-regular fa-circle-check",
    "Total Tasks": "fa-solid fa-list-check",
    "Total Members": "fa-solid fa-users",
  };

  return (
    <div className="container py-4">
      <div className="row mb-4">
        {[
          { title: "Active Sprints", value: activeSprints.length },
          { title: "Completed Sprints", value: completedSprints.length },
          { title: "Total Tasks", value: totalTasks },
          { title: "Total Members", value: data.members.length },
        ].map((item, idx) => (
          <div className="col-md-3" key={idx}>
            <div className="card custom-card rounded-card overflow-hidden">
              <div className="card-body card-body-3">
                <div className="d-flex align-items-center w-100 justify-content-between gap-1">
                  <div>
                    <p className="mb-1 card-test-title">{item.title}</p>
                    <h5 className="mb-0 card-test-value">
                      {loading ? "..." : item.value}
                    </h5>
                  </div>
                  <div className="card-icon">
                    <i className={`${iconMap[item.title]}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label fw-bold">Select Sprint</label>
          <select
            className="form-select"
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
          >
            {sprintOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        {/* Donut Chart */}
        <div className="col-md-6">
          <div
            className="card-body-3 p-3 chart-workload-card"
            style={{ height: 340 }}
          >
            <div className="d-flex justify-content-around align-items-center">
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    activeIndex={activeIndex ?? undefined}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    <Label
                      position="center"
                      content={() => {
                        if (activeIndex !== null && pieData[activeIndex]) {
                          const item = pieData[activeIndex];
                          const percent = ((item.value / total) * 100).toFixed(
                            0
                          );
                          return (
                            <>
                              <text
                                x="50%"
                                y="45%"
                                textAnchor="middle"
                                fontSize={24}
                                fontWeight="bold"
                              >
                                {percent}%
                              </text>
                              <text
                                x="50%"
                                y="60%"
                                textAnchor="middle"
                                fontSize={14}
                                fill="#666"
                              >
                                {item.name}
                              </text>
                            </>
                          );
                        }
                        return (
                          <>
                            <text
                              x="50%"
                              y="45%"
                              textAnchor="middle"
                              fontSize={28}
                              fontWeight="bold"
                            >
                              {total}
                            </text>
                            <text
                              x="50%"
                              y="60%"
                              textAnchor="middle"
                              fontSize={14}
                              fill="#666"
                            >
                              Total Tasks
                            </text>
                          </>
                        );
                      }}
                    />
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-3 me-md-5">
                {pieData.map((item, index) => (
                  <div
                    key={index}
                    className="d-flex align-items-center mb-2"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: item.color,
                        marginRight: 10,
                        borderRadius: 2,
                      }}
                    />
                    <span className="text-dark">
                      {item.name} : <strong>{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Workload */}
        <div className="col-md-6">
          <div
            className="card-body-3 p-3 chart-workload-card"
            style={{ height: 340, display: "flex", flexDirection: "column" }}
          >
            <h6 className="fw-bold mb-3">Team Workload</h6>
            <div className="workload-scroll">
              {memberDistribution.map((member) => {
                const percent = total
                  ? ((member.count / total) * 100).toFixed(0)
                  : 0;
                return (
                  <div key={member.userId} className="row mb-3">
                    <div className="col-md-4">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <div
                          className="d-flex justify-content-center align-items-center text-white fw-bold"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: member.color,
                            fontSize: "0.8rem",
                            padding: 10,
                          }}
                        >
                          {member.initials}
                        </div>
                        <span
                          className="text-dark"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {member.name}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div
                        className="progress"
                        style={{ height: "26px", backgroundColor: "#e6e6e6" }}
                      >
                        <div
                          className="progress-bar d-flex align-items-center"
                          role="progressbar"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: "#5a5a5a",
                            fontSize: "0.75rem",
                            paddingLeft: "6px",
                          }}
                        >
                          {percent}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskSummary;
