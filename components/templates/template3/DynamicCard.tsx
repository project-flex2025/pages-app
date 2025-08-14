import React from "react";
import { TemplateCardsProps } from "../index";

const DynamicCard: React.FC<TemplateCardsProps> = ({
  widgetData,
  cardData,
}) => {
  return (
    <div className="card custom-card  border-primary border border-opacity-50 overflow-hidden main-content-card">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between">
          <div className="flex-grow-1">
            <span className="text-secondary fw-semibold me-1 d-inline-block badge bg-secondary-transparent">
              <i className="fe fe-arrow-up"></i>+0.5%
            </span>
            <h5 className="mt-2 mb-2 fw-medium">{cardData ? cardData.value : "N/A"}</h5>
            <p className="mb-0 fw-medium text-uppercase">{widgetData.config.title}</p>
          </div>
          <div>
            <span className="avatar avatar-md bg-primary svg-white text-fixed-white d-flex">
            <i className="ri-group-line fs-5"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicCard;
