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
          <div className="d-flex align-items-center w-100 justify-content-between gap-1">
            <div>
              <p className="mb-1 card-test-title ">{widgetData.config.title}</p>
              <h5 className="mb-0 card-test-value">
                {cardData ? cardData.value : "N/A"}
              </h5>
            </div>
            <div className="card-icon">
              <i className={`${cardData?.icon}`}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicCard;
