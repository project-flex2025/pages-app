'use client';

export default function PayslipContent() {
  return (
    <div className="payslip-page">
      <h2>Employee Payslip</h2>
      <p><strong>Name:</strong> John Doe</p>
      <p><strong>Designation:</strong> Software Developer</p>
      <p><strong>Month:</strong> July 2025</p>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Earnings</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td>$3000</td>
          </tr>
          <tr>
            <td>HRA</td>
            <td>$800</td>
          </tr>
          <tr>
            <td>Bonus</td>
            <td>$200</td>
          </tr>
        </tbody>
      </table>
      <hr />
      <p><strong>Total:</strong> $4000</p>

      <style jsx>{`
        .payslip-page {
          width: 210mm;
          height: 297mm;
          padding: 20mm;
          background: white;
          color: black;
          font-family: sans-serif;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 8px;
          border: 1px solid #ccc;
        }

        th {
          background: #f2f2f2;
        }
      `}</style>
    </div>
  );
}
