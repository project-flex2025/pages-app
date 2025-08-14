import { useState } from "react";
import Members from "./Members";
import SprintComponent from "./SprintComponent";
import TaskBoard from "./TaskBoard";
import TaskSummary from "./TaskSummary"; 

const tabs = [
  { key: "summary", label: "Summary" },
  { key: "task", label: "Tasks" },
  { key: "sprint", label: "Sprints" },
  { key: "members", label: "Members" },  
];

const DynamicTaskManagement = () => {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <div className="card custom-card rounded-card">
      <div className="card-body">
        {/* Tab Buttons with Bootstrap Styles */}
        <div className="d-flex justify-content-center align-items-center">
          <div className="btn-group">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn ${
                  activeTab === tab.key
                    ? "btn-primary text-white "
                    : "btn-light text-black"
                }`}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                tabIndex={activeTab === tab.key ? 0 : -1}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="">
          {activeTab === "sprint" && <SprintComponent />}
          {activeTab === "members" && <Members />}
          {activeTab === "task" && <TaskBoard />}
          {activeTab === "summary" && <TaskSummary />} {/* New summary tab */}
        </div>
      </div>
    </div>
  );
};

export default DynamicTaskManagement;
