import React from "react";
import { TemplateCardsProps } from "../index";

const DynamicCard: React.FC<TemplateCardsProps> = ({
  widgetData,
  cardData,
}) => {
  return (
    <div className="card custom-card rounded-card overflow-hidden">
      <div className="">
        <div className="card-body card-body-2">
          <div className="d-flex gap-3 align-items-center">
            <div className="card-icon6 d-flex text-primary">
              {/* <i className="fa-solid fa-chart-simple"></i> */}
              <i className={`${cardData?.icon}`}></i>
            </div>
            <div>
              <div className="flex-fill card2-text">
                {widgetData.config.title}
              </div>
              <div className="d-flex align-items-center">
                <div className="card2-test-title">
                  {cardData ? cardData.value : "N/A"}
                </div>
                <div className="card2-text">
                  <span className="badge bg-success-transparent text-success fs-10 ms-2">
                    {/* <i className="ri-arrow-right-up-line fs-11"></i>0.5 */}{" "}
                    +10%
                  </span>
                  <span className="ms-1">vs last month</span>
                </div>
              </div>
            </div>
            <div className="ms-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicCard;
