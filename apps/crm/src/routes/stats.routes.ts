import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const [
      totalCustomers,
      totalOrders,
      totalCampaigns,
      activeCampaigns,
      dndCustomers,
      revenueResult
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'RUNNING' } }),
      prisma.customer.count({ where: { dnd: true } }),
      prisma.order.aggregate({
        _sum: {
          amount: true
        }
      })
    ]);

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue: Number(revenueResult._sum.amount || 0),
      totalCampaigns,
      activeCampaigns,
      dndCustomers
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
