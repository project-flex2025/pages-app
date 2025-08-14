import "jquery";
import "datatables.net";

declare global {
  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
  }

  interface JQuery {
    DataTable: (options?: DataTables.Settings) => DataTables.Api;
  }

  interface JQueryStatic {
    isDataTable?: (selector: string) => boolean;
  }
}
