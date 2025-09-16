import { http } from '@/lib/http'

export type task = {
    id: string;
    userId: string;
    projectId: string | null;
    parentId: string | null;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    startTime: string | null;
    dueTime: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type taskCreate = {
    projectId: string | null;
    parentId: string | null;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    startTime: string | null;
    dueTime: string | null;
}

export async function getTasks(): Promise<task[]> {
    const response = await http('/tasks', { method: 'GET' })
    console.log('API 原始响应数据:', response)
    // http.ts 中已经处理了 items 字段提取，直接返回结果
    const result = Array.isArray(response) ? response : []
    console.log('处理后的数据:', result)
    return result
}

export async function createTask(task: taskCreate) {
    return http('/tasks', { method: 'POST', body: task })
}

export async function updateTask(task: task) {
    return http('/tasks', { method: 'PUT', body: task })
}