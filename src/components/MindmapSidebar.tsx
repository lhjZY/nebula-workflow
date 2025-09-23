import { Files, Plus, Edit3, Trash2, FolderOpen, FileText } from 'lucide-react'
import { useState } from 'react'

import { useMindmapsStore } from '../stores/mindmaps'

export function MindmapSidebar() {
  const { files, activeFileId, createFile, deleteFile, renameFile, setActiveFile } =
    useMindmapsStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreateFile = () => {
    if (!newFileName.trim()) return

    createFile(newFileName.trim())
    setNewFileName('')
    setShowAddForm(false)
  }

  const handleStartEdit = (fileId: string, currentName: string) => {
    setEditingFileId(fileId)
    setEditingName(currentName)
  }

  const handleFinishEdit = () => {
    if (editingFileId && editingName.trim()) {
      renameFile(editingFileId, editingName.trim())
    }
    setEditingFileId(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingFileId(null)
    setEditingName('')
  }

  const handleDeleteFile = (fileId: string, fileName: string) => {
    if (confirm(`确定要删除思维导图 "${fileName}" 吗？此操作不可恢复。`)) {
      deleteFile(fileId)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const fileDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (fileDate.getTime() === today.getTime()) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    }

    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    if (fileDate.getTime() === yesterday.getTime()) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    }

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="glass-strong rounded-2xl h-full flex flex-col p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Files className="w-5 h-5" />
          <h2 className="text-lg font-semibold">思维导图</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="glass rounded-lg p-2 hover:glass-strong transition-all duration-200"
          title="新建思维导图"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 新建文件表单 */}
      {showAddForm && (
        <div className="glass rounded-lg p-3 mb-4 border border-border">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="输入思维导图名称"
            className="w-full bg-transparent text-sm outline-none mb-3 text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFile()
              if (e.key === 'Escape') {
                setShowAddForm(false)
                setNewFileName('')
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateFile}
              className="glass rounded text-xs px-3 py-1.5 hover:glass-strong transition-all duration-200 flex-1"
            >
              创建
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewFileName('')
              }}
              className="glass rounded text-xs px-3 py-1.5 hover:glass-strong transition-all duration-200 flex-1"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="glass rounded-lg p-6 text-center">
            <FolderOpen className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <div className="text-muted-foreground text-sm mb-2">暂无思维导图</div>
            <div className="text-xs text-muted-foreground">点击上方 + 号创建你的第一个思维导图</div>
          </div>
        ) : (
          <div className="space-y-2">
            {files
              .sort((a, b) => b.updatedAt - a.updatedAt) // 按更新时间倒序排列
              .map((file) => (
                <div
                  key={file.id}
                  className={`
                    glass rounded-lg p-3 cursor-pointer group
                    hover:glass-strong transition-all duration-200
                    ${
                      activeFileId === file.id
                        ? 'glass-strong border-primary/50 bg-primary/20 text-primary'
                        : 'text-foreground/90'
                    }
                  `}
                  onClick={() => setActiveFile(file.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingFileId === file.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full bg-transparent text-sm outline-none border-b border-primary"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            onBlur={handleFinishEdit}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <div className="text-sm font-medium truncate" title={file.name}>
                            {file.name}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          更新于 {formatDate(file.updatedAt)}
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(file.id, file.name)
                        }}
                        className="p-1 rounded hover:bg-background/50 transition-colors"
                        title="重命名"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {files.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFile(file.id, file.name)
                          }}
                          className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
