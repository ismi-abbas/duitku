import { useEffect, useState } from "react"
import { Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EditorField } from "@/features/budget/types"
import { serializeFormValue } from "@/features/budget/lib/budget-utils"

type RowEditorDialogProps<T extends Record<string, unknown>> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  fields: EditorField[]
  initialValues: T
  onSave: (form: T) => void
}

export function RowEditorDialog<T extends Record<string, unknown>>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialValues,
  onSave,
}: RowEditorDialogProps<T>) {
  const [form, setForm] = useState(initialValues)

  useEffect(() => {
    setForm(initialValues)
  }, [initialValues])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] overflow-y-auto bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.copySourceKey && field.copySourceKey in form ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: current[field.copySourceKey as keyof T],
                      }))
                    }
                  >
                    <Copy className="size-3" />
                    {field.copyLabel ?? `Same as ${field.copySourceKey}`}
                  </Button>
                ) : null}
              </div>
              {field.type === "boolean" ? (
                <Select
                  value={serializeFormValue(form[field.key] ?? false)}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.key}
                  type={field.type === "date" ? "date" : field.type || "text"}
                  value={serializeFormValue(form[field.key])}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(form)
              onOpenChange(false)
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
