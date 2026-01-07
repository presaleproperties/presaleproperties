import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { YearlyProjection } from "@/types/roi";

interface ProformaTableProps {
  projections: YearlyProjection[];
}

export function ProformaTable({ projections }: ProformaTableProps) {
  const formatCurrency = (value: number, compact = false) => {
    if (compact && Math.abs(value) >= 1000) {
      return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    }
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const rows = [
    { 
      label: "Gross Rent", 
      key: "grossRent" as keyof YearlyProjection,
      type: "income" 
    },
    { 
      label: "Other Income", 
      key: "otherIncome" as keyof YearlyProjection,
      type: "income" 
    },
    { 
      label: "Vacancy Loss", 
      key: "vacancyLoss" as keyof YearlyProjection,
      type: "expense",
      negate: true 
    },
    { 
      label: "Effective Rent", 
      key: "effectiveRent" as keyof YearlyProjection,
      type: "subtotal" 
    },
    { 
      label: "Strata Fees", 
      key: "strataFees" as keyof YearlyProjection,
      type: "expense" 
    },
    { 
      label: "Property Tax", 
      key: "propertyTax" as keyof YearlyProjection,
      type: "expense" 
    },
    { 
      label: "Insurance", 
      key: "insurance" as keyof YearlyProjection,
      type: "expense" 
    },
    { 
      label: "Maintenance", 
      key: "maintenance" as keyof YearlyProjection,
      type: "expense" 
    },
    { 
      label: "Management", 
      key: "managementFees" as keyof YearlyProjection,
      type: "expense" 
    },
    { 
      label: "Total Expenses", 
      key: "totalExpenses" as keyof YearlyProjection,
      type: "subtotal" 
    },
    { 
      label: "NOI", 
      key: "noi" as keyof YearlyProjection,
      type: "total" 
    },
    { 
      label: "Mortgage Payment", 
      key: "mortgagePayment" as keyof YearlyProjection,
      type: "expense" 
    },
    { 
      label: "Net Cashflow", 
      key: "netCashflow" as keyof YearlyProjection,
      type: "highlight" 
    },
    { 
      label: "Principal Paid", 
      key: "principalPaydown" as keyof YearlyProjection,
      type: "info" 
    },
    { 
      label: "Mortgage Balance", 
      key: "mortgageBalance" as keyof YearlyProjection,
      type: "info" 
    },
    { 
      label: "Est. Value", 
      key: "estimatedValue" as keyof YearlyProjection,
      type: "value" 
    },
    { 
      label: "Equity", 
      key: "equity" as keyof YearlyProjection,
      type: "highlight" 
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">5-Year Proforma</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">
                  Item
                </TableHead>
                {projections.map((p) => (
                  <TableHead key={p.year} className="text-right min-w-[90px]">
                    Year {p.year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow 
                  key={row.label}
                  className={
                    row.type === "subtotal" ? "bg-muted/30 font-medium" :
                    row.type === "total" ? "bg-muted/50 font-semibold" :
                    row.type === "highlight" ? "bg-primary/5 font-semibold" :
                    ""
                  }
                >
                  <TableCell className="sticky left-0 bg-inherit z-10 text-sm">
                    {row.label}
                  </TableCell>
                  {projections.map((p) => {
                    const value = p[row.key] as number;
                    const displayValue = row.negate ? -value : value;
                    const isNegative = displayValue < 0;
                    
                    return (
                      <TableCell 
                        key={p.year} 
                        className={`text-right text-sm tabular-nums ${
                          row.type === "highlight" && isNegative ? "text-destructive" :
                          row.type === "highlight" && !isNegative ? "text-green-600 dark:text-green-500" :
                          row.type === "expense" && row.negate ? "text-destructive" :
                          ""
                        }`}
                      >
                        {row.negate && value > 0 ? "-" : ""}
                        {formatCurrency(Math.abs(value), true)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
