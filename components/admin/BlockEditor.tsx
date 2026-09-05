'use client'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import ImageUpload from '@/components/admin/ImageUpload'
import type { Block } from '@/lib/posts/blocks'

export type BlockEditorProps = {
  value: Block[]
  onChange: (blocks: Block[]) => void
}

const BLOCK_LABELS: Record<Block['type'], string> = {
  paragraph: 'Paragraph',
  heading: 'Heading',
  scripture: 'Scripture',
  pullquote: 'Pull quote',
  list: 'List',
  image: 'Image',
}

function emptyBlock(type: Block['type']): Block {
  switch (type) {
    case 'paragraph':
      return { type: 'paragraph', text: '' }
    case 'heading':
      return { type: 'heading', level: 2, text: '' }
    case 'scripture':
      return { type: 'scripture', text: '', reference: '' }
    case 'pullquote':
      return { type: 'pullquote', text: '', cite: '' }
    case 'list':
      return { type: 'list', style: 'bullet', items: [''] }
    case 'image':
      return { type: 'image', src: '', alt: '', caption: '' }
  }
}

/**
 * Structured body editor: an ordered list of typed blocks with add /
 * remove / move-up / move-down. Never raw HTML — the saved payload is
 * validated against the block schema server-side.
 */
export default function BlockEditor({ value, onChange }: BlockEditorProps) {
  function updateBlock(index: number, block: Block) {
    onChange(value.map((existing, i) => (i === index ? block : existing)))
  }

  function removeBlock(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    const [block] = next.splice(index, 1)
    next.splice(target, 0, block!)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-body-sm font-semibold text-text-primary">Body blocks</span>

      {value.length === 0 && (
        <p className="border border-dashed border-border-strong px-4 py-6 text-center text-body-sm text-text-muted">
          No blocks yet — add the first one below.
        </p>
      )}

      {value.map((block, index) => (
        <fieldset
          key={index}
          className="border border-border-subtle bg-surface-raised p-4"
        >
          <legend className="flex items-center gap-2 px-1 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
            {index + 1}. {BLOCK_LABELS[block.type]}
          </legend>
          <div className="mb-3 flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Move block up"
              disabled={index === 0}
              onClick={() => moveBlock(index, -1)}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Move block down"
              disabled={index === value.length - 1}
              onClick={() => moveBlock(index, 1)}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remove block"
              onClick={() => removeBlock(index)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <BlockFields block={block} onChange={(next) => updateBlock(index, next)} />
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(BLOCK_LABELS) as Block['type'][]).map((type) => (
          <Button
            key={type}
            variant="secondary"
            size="sm"
            onClick={() => onChange([...value, emptyBlock(type)])}
          >
            <Plus className="size-4" aria-hidden="true" />
            {BLOCK_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  )
}

function BlockFields({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <Textarea
          label="Text"
          rows={4}
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
        />
      )
    case 'heading':
      return (
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Select
            label="Level"
            value={String(block.level)}
            onChange={(event) =>
              onChange({ ...block, level: Number(event.target.value) === 3 ? 3 : 2 })
            }
          >
            <option value="2">H2</option>
            <option value="3">H3</option>
          </Select>
          <Input
            label="Text"
            value={block.text}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
          />
        </div>
      )
    case 'scripture':
      return (
        <div className="flex flex-col gap-4">
          <Textarea
            label="Scripture text"
            rows={3}
            value={block.text}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
          />
          <Input
            label="Reference"
            placeholder="Genesis 28:16"
            value={block.reference}
            onChange={(event) => onChange({ ...block, reference: event.target.value })}
          />
        </div>
      )
    case 'pullquote':
      return (
        <div className="flex flex-col gap-4">
          <Textarea
            label="Quote"
            rows={3}
            value={block.text}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
          />
          <Input
            label="Attribution (optional)"
            value={block.cite ?? ''}
            onChange={(event) => onChange({ ...block, cite: event.target.value })}
          />
        </div>
      )
    case 'list':
      return (
        <div className="flex flex-col gap-4">
          <Select
            label="Style"
            value={block.style}
            onChange={(event) =>
              onChange({ ...block, style: event.target.value === 'number' ? 'number' : 'bullet' })
            }
          >
            <option value="bullet">Bulleted</option>
            <option value="number">Numbered</option>
          </Select>
          <Textarea
            label="Items"
            rows={5}
            hint="One item per line."
            value={block.items.join('\n')}
            onChange={(event) => onChange({ ...block, items: event.target.value.split('\n') })}
          />
        </div>
      )
    case 'image':
      return (
        <div className="flex flex-col gap-4">
          <ImageUpload
            name="block-image"
            label="Image"
            value={block.src}
            onChange={(src) => onChange({ ...block, src })}
          />
          <Input
            label="Alt text"
            value={block.alt}
            hint="Describe the image for screen readers."
            onChange={(event) => onChange({ ...block, alt: event.target.value })}
          />
          <Input
            label="Caption (optional)"
            value={block.caption ?? ''}
            onChange={(event) => onChange({ ...block, caption: event.target.value })}
          />
        </div>
      )
  }
}
