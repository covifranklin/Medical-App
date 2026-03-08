import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";

export const dynamic = "force-dynamic";

// GET /api/plans — list all treatment plans for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    const plans = await prisma.treatmentPlan.findMany({
      where: { ailment: { userId: user.id } },
      include: {
        ailment: {
          select: { id: true, name: true, bodyRegion: true },
        },
        _count: {
          select: { exercises: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      prescribedBy: plan.prescribedBy,
      frequency: plan.frequency,
      startDate: plan.startDate.toISOString().split("T")[0],
      ailment: plan.ailment,
      _count: plan._count,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "fetch plans");
  }
}
