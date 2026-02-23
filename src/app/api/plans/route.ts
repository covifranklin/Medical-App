import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

// GET /api/plans — list all treatment plans for the authenticated user
export async function GET() {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const plans = await prisma.treatmentPlan.findMany({
      where: {
        ailment: { userId },
      },
      include: {
        ailment: {
          select: { id: true, name: true },
        },
        _count: { select: { exercises: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    const result = plans.map((p) => ({
      id: p.id,
      title: p.title,
      prescribedBy: p.prescribedBy,
      frequency: p.frequency,
      isActive: p.isActive,
      startDate: p.startDate.toISOString().split("T")[0],
      exerciseCount: p._count.exercises,
      ailmentId: p.ailment.id,
      ailmentName: p.ailment.name,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
