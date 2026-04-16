import { useEffect, useState } from "react"

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
import type { EditorField } from "@/features/budget/types"

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
      <DialogContent className="max-w-lg border-0 bg-popover ring-1 ring-foreground/10">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type || "text"}
                value={String(form[field.key] ?? "")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <DialogFooter>
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
