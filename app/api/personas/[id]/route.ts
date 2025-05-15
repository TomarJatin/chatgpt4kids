import { NextResponse } from 'next/server'
import { updatePersonaDetails, deletePersonaById, deletePersonaSettingsByPersonaId } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'  // ensure params is awaited

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json()
  const updated = await updatePersonaDetails(params.id, data)
  return NextResponse.json(updated)
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    // Next.js App Router now treats params as async
    const { id } = await params
  
    try {
      // 1) Remove any settings tied to this persona
      await deletePersonaSettingsByPersonaId(id)
  
      // 2) Then remove the persona itself
      await deletePersonaById(id)
  
      // 3) Success!
      return new NextResponse(null, { status: 204 })
    } catch (err: any) {
      console.error('Failed to delete persona:', err)
  
      // If it's still a foreign-key issue, let the client know
      if (err.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete persona with existing settings.' },
          { status: 409 }
        )
      }
  
      return NextResponse.json(
        { error: 'Failed to delete persona.' },
        { status: 500 }
      )
    }
  }