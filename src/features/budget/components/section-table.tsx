import { useMemo, useState, type ReactNode } from "react"
import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  type?: "currency" | "text" | "tags" | "date"
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
      [
        row.name,
        "category" in row ? String(row.category || "") : "",
        "tags" in row && Array.isArray(row.tags) ? row.tags.join(" ") : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
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

  const mobileColumns = columns.filter((column) => column.key !== "name")

  function renderColumnValue(row: BudgetRowMap[Section], column: Column<Section>) {
    const value = row[column.key]

    if (column.type === "currency") {
      return currency.format(toNumber(value))
    }

    if (column.type === "tags" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.length > 0 ? (
            value.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      )
    }

    if (column.type === "date") {
      return String(value || "-")
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }

    return String(value || "-")
  }

  function renderTableCell(row: BudgetRowMap[Section], column: Column<Section>) {
    const content = renderColumnValue(row, column)

    if (typeof content === "string") {
      return content
    }

    return content as ReactNode
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <CardContent className="space-y-4 p-0">
          <div className="hidden md:block">
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
                    const canCopyPayableToActual =
                      payableColumn &&
                      "actual" in row &&
                      (payableColumn.key === "budget" || payableColumn.key === "estimate")

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
                            {renderTableCell(row, column)}
                          </TableCell>
                        ))}

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {canCopyPayableToActual ? (
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() =>
                                  upsertRow(section, {
                                    ...row,
                                    actual: toNumber(row[payableColumn.key]),
                                  } as BudgetRowMap[Section])
                                }
                                title={`Use ${payableColumn.label.toLowerCase()} as actual`}
                              >
                                <Copy className="size-4" />
                              </Button>
                            ) : null}
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
          </div>

          <div className="grid gap-3 px-4 pb-4 md:hidden">
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => {
                const isDone = "done" in row && row.done
                const canCopyPayableToActual =
                  payableColumn &&
                  "actual" in row &&
                  (payableColumn.key === "budget" || payableColumn.key === "estimate")

                return (
                  <Card key={row.id} className={isDone ? "bg-muted/30" : undefined}>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {showDone ? (
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
                            ) : null}
                            <p
                              className={
                                isDone
                                  ? "truncate font-medium text-muted-foreground line-through"
                                  : "truncate font-medium"
                              }
                            >
                              {String(row.name || "-")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {columns.find((column) => column.key === "category") ? (
                              <span>{String((row as { category?: string }).category || "No category")}</span>
                            ) : null}
                            {columns.find((column) => column.key === "dueDate") ? (
                              <span>{String((row as { dueDate?: string }).dueDate || "No due date")}</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                          {canCopyPayableToActual ? (
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() =>
                                upsertRow(section, {
                                  ...row,
                                  actual: toNumber(row[payableColumn.key]),
                                } as BudgetRowMap[Section])
                              }
                              title={`Use ${payableColumn.label.toLowerCase()} as actual`}
                            >
                              <Copy className="size-4" />
                            </Button>
                          ) : null}
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
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {mobileColumns.map((column) => (
                          <div
                            key={String(column.key)}
                            className="rounded-lg bg-muted/20 p-3"
                          >
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              {column.label}
                            </p>
                            <div
                              className={
                                isDone
                                  ? "mt-1 text-sm text-muted-foreground line-through"
                                  : "mt-1 text-sm"
                              }
                            >
                              {renderColumnValue(row, column)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  No rows match your search.
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/20">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Totals</p>
                  {showDone ? (
                    <p className="text-sm text-muted-foreground">
                      Left to pay {currency.format(leftToPay)}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {columns
                    .filter((column) => column.sum)
                    .map((column) => (
                      <div
                        key={String(column.key)}
                        className="rounded-lg bg-background p-3"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {column.label}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {currency.format(totals[String(column.key)] || 0)}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
      return {
        id: "",
        name: "",
        amount: 0,
        gross: 0,
        category: "",
        tags: [],
        recurring: false,
      } as unknown as BudgetRowMap[Section]
    case "expenses":
      return {
        id: "",
        name: "",
        budget: 0,
        actual: 0,
        done: false,
        category: "",
        tags: [],
        dueDate: "",
        recurring: false,
      } as unknown as BudgetRowMap[Section]
    case "creditCard":
      return {
        id: "",
        name: "",
        estimate: 0,
        actual: 0,
        done: false,
        category: "",
        tags: [],
        dueDate: "",
        recurring: false,
      } as unknown as BudgetRowMap[Section]
    case "installments":
      return {
        id: "",
        name: "",
        amount: 0,
        done: false,
        category: "",
        tags: [],
        dueDate: "",
        recurring: false,
      } as unknown as BudgetRowMap[Section]
    case "savingsGoals":
      return {
        id: "",
        name: "",
        target: 0,
        saved: 0,
        dueDate: "",
        category: "",
        tags: [],
        recurring: false,
        done: false,
      } as unknown as BudgetRowMap[Section]
  }
}
