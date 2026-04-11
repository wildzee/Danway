import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth/api-auth';

// GET - List employees for current site
export async function GET(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const employees = await prisma.employee.findMany({
            where: { siteId: session.siteId },
            orderBy: { employeeId: 'asc' },
        });

        return NextResponse.json({ success: true, count: employees.length, data: employees });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const body = await request.json();
        const { employeeId, name, designation, mobile, shift, isEngineer, allowOvertime, network, activity, element } = body;

        if (!employeeId || !name || !designation) {
            return NextResponse.json({ error: 'Employee ID, name, and designation are required' }, { status: 400 });
        }

        if (!session.siteId) {
            return NextResponse.json({ error: 'No site context in session' }, { status: 403 });
        }

        // Check if employee already exists in this site
        const existing = await prisma.employee.findFirst({
            where: { employeeId, siteId: session.siteId },
        });

        if (existing) {
            return NextResponse.json({ error: 'Employee with this ID already exists in this site' }, { status: 400 });
        }

        const employee = await prisma.employee.create({
            data: {
                employeeId,
                name,
                designation,
                mobile: mobile || null,
                shift: shift || 'Day shift',
                isEngineer: isEngineer || false,
                allowOvertime: allowOvertime !== undefined ? allowOvertime : !isEngineer,
                siteId: session.siteId,
                project: session.siteCode || 'D657',
                network: network || '5001323',
                activity: activity || '0010',
                element: element || '0102',
            },
        });

        return NextResponse.json({ success: true, message: 'Employee created successfully', data: employee });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Failed to create employee', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

// DELETE - Delete employee
export async function DELETE(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        // Verify employee belongs to this site
        const employee = await prisma.employee.findFirst({ where: { id, siteId: session.siteId } });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        await prisma.employee.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}

// PUT - Update employee
export async function PUT(request: NextRequest) {
    const result = await requireSession(request);
    if (result instanceof NextResponse) return result;
    const { session } = result;

    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }

        // Verify employee belongs to this site
        const employee = await prisma.employee.findFirst({ where: { id, siteId: session.siteId } });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Prevent changing siteId
        delete updateData.siteId;

        const updated = await prisma.employee.update({ where: { id }, data: updateData });
        return NextResponse.json({ success: true, message: 'Employee updated successfully', data: updated });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}
