import { Form, Input, InputNumber, Select, Button, Table, Upload, Divider, Typography, message } from 'antd'
import { PlusOutlined, DeleteOutlined, InboxOutlined, TeamOutlined } from '@ant-design/icons'
import { useEffect, useRef } from 'react'

const { Text } = Typography

const SEX_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
]

const MAX_FILE_MB = 10

// Read a picked file into a data URL so the attachment survives with the
// incident record (there is no upload server — data lives in memory).
const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

// Browsers block opening data: URLs directly, so open them as blob URLs.
const openAttachment = async (file) => {
  if (!file.url) return
  const blob = await (await fetch(file.url)).blob()
  window.open(URL.createObjectURL(blob), '_blank', 'noopener')
}

// Controlled attachment list (value/onChange) for use inside a Form.Item.
function FileAttachments({ value = [], onChange }) {
  // Several files picked at once finish reading at different times; track the
  // latest list in a ref so none of them overwrite each other.
  const latest = useRef(value)
  useEffect(() => { latest.current = value }, [value])

  const beforeUpload = async (file) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      message.error(`${file.name} is larger than ${MAX_FILE_MB} MB.`)
      return Upload.LIST_IGNORE
    }
    try {
      const url = await readAsDataURL(file)
      const entry = {
        uid: file.uid,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'done',
        url,
        thumbUrl: file.type.startsWith('image/') ? url : undefined,
      }
      latest.current = [...(latest.current ?? []), entry]
      onChange?.(latest.current)
    } catch {
      message.error(`Could not read ${file.name}.`)
    }
    // Never upload anywhere — the file is kept on the form value instead.
    return false
  }

  return (
    <Upload.Dragger
      multiple
      listType="picture"
      fileList={value}
      beforeUpload={beforeUpload}
      onRemove={(file) => onChange?.(value.filter(f => f.uid !== file.uid))}
      onPreview={openAttachment}
    >
      <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#AE2448' }} /></p>
      <p className="ant-upload-text">Click or drag files here to attach</p>
      <p className="ant-upload-hint">
        Images, documents, PDFs, audio, video, etc. — up to {MAX_FILE_MB} MB each.
      </p>
    </Upload.Dragger>
  )
}

// Editable table of people (victims or suspects) backed by a Form.List.
function PersonTable({ listName, label, extraField }) {
  return (
    <Form.List name={listName}>
      {(fields, { add, remove }) => (
        <>
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="key"
            dataSource={fields}
            locale={{ emptyText: `No ${label.toLowerCase()} added.` }}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Full Name',
                render: (_, field) => (
                  <Form.Item
                    name={[field.name, 'name']}
                    rules={[{ required: true, message: 'Name is required.' }]}
                    style={{ margin: 0 }}
                  >
                    <Input placeholder="Full name" />
                  </Form.Item>
                ),
              },
              {
                title: 'Age',
                width: 80,
                render: (_, field) => (
                  <Form.Item name={[field.name, 'age']} style={{ margin: 0 }}>
                    <InputNumber min={0} max={150} placeholder="Age" style={{ width: '100%' }} />
                  </Form.Item>
                ),
              },
              {
                title: 'Sex',
                width: 110,
                render: (_, field) => (
                  <Form.Item name={[field.name, 'sex']} style={{ margin: 0 }}>
                    <Select placeholder="Sex" options={SEX_OPTIONS} allowClear />
                  </Form.Item>
                ),
              },
              {
                title: 'Contact / Address',
                render: (_, field) => (
                  <Form.Item name={[field.name, 'contact']} style={{ margin: 0 }}>
                    <Input placeholder="Contact no. or address" />
                  </Form.Item>
                ),
              },
              {
                title: extraField.title,
                render: (_, field) => (
                  <Form.Item name={[field.name, extraField.name]} style={{ margin: 0 }}>
                    <Input placeholder={extraField.placeholder} />
                  </Form.Item>
                ),
              },
              {
                width: 48,
                align: 'center',
                render: (_, field) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                    aria-label={`Remove ${label.toLowerCase()}`}
                  />
                ),
              },
            ]}
          />
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => add()}
            style={{ marginTop: 8 }}
          >
            Add {label.replace(/s$/, '')}
          </Button>
        </>
      )}
    </Form.List>
  )
}

function VictimsSuspectsSection() {
  return (
    <>
      <Divider titlePlacement="start" style={{ color: '#AE2448' }}>
        <TeamOutlined style={{ marginRight: 6 }} />
        Victims &amp; Suspects
      </Divider>

      <Form.Item label="Victims" style={{ marginBottom: 12 }}>
        <PersonTable
          listName="victims"
          label="Victims"
          extraField={{ name: 'injuries', title: 'Injuries / Losses', placeholder: 'e.g. stolen laptop' }}
        />
      </Form.Item>
      <Form.Item
        label={<Text>Victim Attachments</Text>}
        name="victimAttachments"
        tooltip="Photos, statements, IDs, medical reports, or any related files."
      >
        <FileAttachments />
      </Form.Item>

      <Form.Item label="Suspects" style={{ marginBottom: 12 }}>
        <PersonTable
          listName="suspects"
          label="Suspects"
          extraField={{ name: 'description', title: 'Description', placeholder: 'e.g. height, clothing' }}
        />
      </Form.Item>
      <Form.Item
        label={<Text>Suspect Attachments</Text>}
        name="suspectAttachments"
        tooltip="CCTV stills, photos, evidence documents, or any related files."
      >
        <FileAttachments />
      </Form.Item>
    </>
  )
}

export default VictimsSuspectsSection
