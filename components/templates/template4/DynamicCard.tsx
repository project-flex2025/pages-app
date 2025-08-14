import React from "react";
// import Chart from "../../Chart";
// import { ApexOptions } from "apexcharts";
import { TemplateCardsProps } from "../index";

// const employeesOptions: ApexOptions = {
//   series: [
//     {
//       name: "Employees",
//       data: [
//         47, 45, 54, 38, 56, 24, 65, 31, 37, 39, 62, 51, 35, 41, 35, 27, 53,
//         53, 61, 27, 54, 43, 19, 46,
//       ],
//     },
//   ],
//   chart: {
//     type: "area",
//     height: 50,
//     sparkline: { enabled: true },
//     dropShadow: {
//       enabled: true,
//       enabledOnSeries: undefined,
//       top: 0,
//       left: 0,
//       blur: 3,
//       color: "var(--chart-color)",
//       opacity: 0.4,
//     },
//   },
//   stroke: { curve: "straight", width: 1 },
//   fill: {
//     type: "gradient",
//     gradient: {
//       opacityFrom: 0.5,
//       opacityTo: 0.2,
//       stops: [0, 60],
//       colorStops: [
//         [
//           { offset: 0, color: "var(--chart-color)", opacity: 0.5 },
//           { offset: 60, color: "var(--chart-color)", opacity: 0.2 },
//         ],
//       ],
//     },
//   },
//   colors: ["var(--chart-color)"],
//   tooltip: {
//     fixed: { enabled: false },
//     x: { show: false },
//     y: { title: { formatter: () => "" } },
//   },
// };

const DynamicCard: React.FC<TemplateCardsProps> = ({
  widgetData,
  cardData,
}) => {
  return (
    <div className="card custom-card rounded-card overflow-hidden">
      <div className="">
        <div className="card-body p-3">
          <div className="d-flex align-items-center w-100 justify-content-between gap-1">
            <div className="card-icon3 text-primary">
              <i className={`${cardData?.icon}`}></i>
            </div>
            <div className="d-flex flex-column align-items-center">
              <div className="card-icon2">
                <i className="ri-corner-right-up-line"></i>
              </div>
              +11.01%
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-1 text-muted">{widgetData.config.title}</p>
            <h5 className="mb-0 fw-500 ">
              {cardData ? cardData.value : "N/A"}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicCard;
