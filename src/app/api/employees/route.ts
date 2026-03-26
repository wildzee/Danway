import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Create new employee
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { employeeId, name, designation, mobile, shift, isEngineer, allowOvertime, network, activity, element, project } = body;

        // Validate required fields
        if (!employeeId || !name || !designation) {
            return NextResponse.json(
                { error: 'Employee ID, name, and designation are required' },
                { status: 400 }
            );
        }

        // Check if employee already exists
        const existing = await prisma.employee.findUnique({
            where: { employeeId },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Employee with this ID already exists' },
                { status: 400 }
            );
        }

        // Create employee
        const employee = await prisma.employee.create({
            data: {
                employeeId,
                name,
                designation,
                mobile: mobile || null,
                shift: shift || 'Day shift',
                isEngineer: isEngineer || false,
                allowOvertime: allowOvertime !== undefined ? allowOvertime : !isEngineer, // staff default false, workers default true
                project: project || 'D657',
                network: network || '5001323',
                activity: activity || '0010',
                element: element || '0102',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Employee created successfully',
            data: employee,
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json(
            {
                error: 'Failed to create employee',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete employee
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Employee ID is required' },
                { status: 400 }
            );
        }

        await prisma.employee.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Employee deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete employee',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// PUT - Update employee
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Employee ID is required' },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            message: 'Employee updated successfully',
            data: employee,
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json(
            {
                error: 'Failed to update employee',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
