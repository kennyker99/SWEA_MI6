import { Router } from "express";

const router = Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    // No password set — open access
    return res.json({ ok: true, token: "no-auth" });
  }

  if (password === appPassword) {
    return res.json({ ok: true, token: appPassword });
  }

  res.status(401).json({ ok: false, error: "密码错误" });
});

// GET /api/auth/verify
router.get("/verify", (req, res) => {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return res.json({ ok: true });

  const auth = req.headers.authorization?.replace("Bearer ", "");
  if (auth === appPassword) return res.json({ ok: true });

  res.status(401).json({ ok: false });
});

export default router;
