import { useMemo, useState } from "react"
import { Check, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { editorFields } from "@/features/budget/constants"
import { useBudgetStore } from "@/features/budget/hooks/use-budget-store"
import {
  currency,
  normalizeFormValues,
  sumColumn,
  toNumber,
} from "@/features/budget/lib/budget-utils"
import { RowEditorDialog } from "@/features/budget/components/row-editor-dialog"
import type { BudgetRowMap, BudgetSection } from "@/features/budget/types"

type Column<Section extends BudgetSection> = {
  key: keyof BudgetRowMap[Section]
  label: string
  type?: "currency" | "text"
  sum?: boolean
  payable?: boolean
}

type SectionTableProps<Section extends BudgetSection> = {
  section: Section
  title: string
  description: string
  rows: BudgetRowMap[Section][]
  columns: Column<Section>[]
  addLabel: string
  searchPlaceholder?: string
  searchable?: boolean
  showDone?: boolean
}

export function SectionTable<Section extends BudgetSection>({
  section,
  title,
  description,
  rows,
  columns,
  addLabel,
  searchPlaceholder,
  searchable = false,
  showDone = false,
}: SectionTableProps<Section>) {
  const { deleteRow, toggleDone, upsertRow } = useBudgetStore()
  const [query, setQuery] = useState("")
  const [editingRow, setEditingRow] = useState<BudgetRowMap[Section] | null>(
    null
  )
  const [isOpen, setIsOpen] = useState(false)

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return rows
    }

    return rows.filter((row) =>
      row.name.toLowerCase().includes(normalizedQuery)
    )
  }, [query, rows])

  const totals = useMemo(() => {
    return columns.reduce<Record<string, number>>((result, column) => {
      if (column.sum) {
        result[String(column.key)] = sumColumn(filteredRows, column.key)
      }

      return result
    }, {})
  }, [columns, filteredRows])

  const payableColumn = columns.find((column) => column.payable || column.sum)
  const leftToPay = filteredRows.reduce((sum, row) => {
    if (!showDone || !("done" in row) || row.done || !payableColumn) {
      return sum
    }

    return sum + toNumber(row[payableColumn.key])
  }, 0)

  const initialValues = (editingRow ||
    createEmptyRow(section)) as BudgetRowMap[Section]

  return (
    <>
      <Card className="border-0 bg-card ring-1 ring-foreground/10">
        <CardHeader className="gap-4 border-b border-border/60 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {searchable ? (
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full sm:w-64"
              />
            ) : null}
            <Button
              onClick={() => {
                setEditingRow(null)
                setIsOpen(true)
              }}
            >
              <Plus className="size-4" />
              {addLabel}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {showDone ? (
                    <TableHead className="w-16">Done</TableHead>
                  ) : null}
                  {columns.map((column) => (
                    <TableHead key={String(column.key)}>
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRows.map((row) => {
                  const isDone = "done" in row && row.done

                  return (
                    <TableRow
                      key={row.id}
                      className={isDone ? "bg-muted/20" : undefined}
                    >
                      {showDone ? (
                        <TableCell>
                          <Button
                            size="icon-sm"
                            variant={isDone ? "default" : "outline"}
                            onClick={() =>
                              toggleDone(
                                section as Exclude<Section, "income">,
                                row.id
                              )
                            }
                          >
                            <Check className="size-4" />
                          </Button>
                        </TableCell>
                      ) : null}

                      {columns.map((column) => (
                        <TableCell
                          key={String(column.key)}
                          className={
                            isDone
                              ? "text-muted-foreground line-through"
                              : undefined
                          }
                        >
                          {column.type === "currency"
                            ? currency.format(toNumber(row[column.key]))
                            : String(row[column.key] || "-")}
                        </TableCell>
                      ))}

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRow(row)
                              setIsOpen(true)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => deleteRow(section, row.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {showDone ? <TableCell>Total</TableCell> : null}
                  {columns.map((column, index) => (
                    <TableCell key={String(column.key)}>
                      {index === 0
                        ? showDone
                          ? title
                          : "Total"
                        : column.sum
                          ? currency.format(totals[String(column.key)] || 0)
                          : ""}
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>

                {showDone ? (
                  <TableRow className="bg-background hover:bg-background">
                    <TableCell>Left</TableCell>
                    {columns.map((column, index) => (
                      <TableCell key={String(column.key)}>
                        {index === 0
                          ? "Not done yet"
                          : column === payableColumn
                            ? currency.format(leftToPay)
                            : ""}
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <RowEditorDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={editingRow ? `Edit ${title.toLowerCase()}` : addLabel}
        description="Update the values below and save them to the current month."
        fields={editorFields[section]}
        initialValues={initialValues}
        onSave={(form) =>
          upsertRow(section, normalizeFormValues(form) as BudgetRowMap[Section])
        }
      />
    </>
  )
}

function createEmptyRow<Section extends BudgetSection>(
  section: Section
): BudgetRowMap[Section] {
  switch (section) {
    case "income":
      return { id: "", name: "", amount: 0, gross: 0 } as BudgetRowMap[Section]
    case "expenses":
      return {
        id: "",
        name: "",
        budget: 0,
        actual: 0,
        done: false,
      } as BudgetRowMap[Section]
    case "creditCard":
      return {
        id: "",
        name: "",
        estimate: 0,
        actual: 0,
        done: false,
      } as BudgetRowMap[Section]
    case "installments":
      return {
        id: "",
        name: "",
        amount: 0,
        done: false,
      } as BudgetRowMap[Section]
  }
}
