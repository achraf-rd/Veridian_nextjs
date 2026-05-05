import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        conversations: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('[GET /api/projects] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    console.log('[POST /api/projects] Session:', { hasSession: !!session, hasUserId: !!session?.user?.id })

    if (!session?.user?.id) {
      console.warn('[POST /api/projects] Unauthorized - no session or user.id')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await req.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const duplicate = await prisma.project.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' }, userId: session.user.id },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'A project with this name already exists' }, { status: 409 })
    }

    console.log('[POST /api/projects] Creating project:', { name, userId: session.user.id })

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        userId: session.user.id,
      },
    })

    console.log('[POST /api/projects] Project created:', project.id)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('[POST /api/projects] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
