// declare module "bootstrap-datepicker" {
//   import * as $ from "jquery";

//   interface DatepickerOptions {
//     format?: string;
//     autoclose?: boolean;
//     todayHighlight?: boolean;
//     // Add more options as needed
//   }

//   interface JQuery {
//     datepicker(options?: DatepickerOptions): JQuery;
//   }

//   export = $;
// }

// types/bootstrap-datepicker.d.ts
declare module "bootstrap-datepicker" {
  import * as $ from "jquery";

  interface DatepickerOptions {
    format?: string;
    autoclose?: boolean;
    todayHighlight?: boolean;
    // Add more options if needed
  }

  // interface DatepickerApi {
  //   show: () => void;
  //   hide: () => void;
  //   update: (value: string | Date) => void;
  //   // Add other methods if needed
  // }

  declare global {
    interface JQuery {
      datepicker(): JQuery;
      datepicker(method: string): JQuery;
      datepicker(options: DatepickerOptions): JQuery;
      datepicker(method: string, parameter: unknown): JQuery; // ← You can leave this as a fallback if needed
    }
  }

  export = $;
}
