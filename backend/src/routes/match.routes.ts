import express from "express"
import {
  createMatch,
  getMatches,
  getMatchById,
  updateMatch,
  updateMatchScore,
  deleteMatch,
} from "../controllers/match.controller"
import { authenticateToken, requireAdminOrCoach } from "../middleware/auth.middleware"
import { body, param, validationResult } from "express-validator"
import { badRequest } from "../utils/apiResponse"

const router = express.Router()

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return badRequest(
      res,
      errors
        .array()
        .map((err) => err.msg)
        .join(", "),
    )
  }
  return next()
}

// Match validation
const matchValidation = [
  body("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Format de date invalide (YYYY-MM-DD)"),
  body("time")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Format d'heure invalide (HH:MM)"),
  body("venue").trim().isLength({ min: 3, max: 100 }).withMessage("Le lieu doit contenir entre 3 et 100 caractères"),
  body("homeTeam").isString().isLength({ min: 1 }).withMessage("Équipe domicile requise"),
  body("awayTeam").isString().isLength({ min: 1 }).withMessage("Équipe visiteur requise"),
  body("tournamentId").isString().isLength({ min: 1 }).withMessage("ID de tournoi requis"),
  body("groupId").optional().isString().withMessage("ID de groupe invalide"),
]

// Score validation
const scoreValidation = [
  body("homeScore").isInt({ min: 0, max: 50 }).withMessage("Score domicile invalide"),
  body("awayScore").isInt({ min: 0, max: 50 }).withMessage("Score visiteur invalide"),
  body("status").optional().isIn(["scheduled", "in_progress", "completed"]).withMessage("Statut invalide"),
]

// ID validation
const idValidation = [param("id").isString().isLength({ min: 1 }).withMessage("ID invalide")]

// Routes
router.get("/", authenticateToken, getMatches)
router.get("/:id", authenticateToken, idValidation, validateRequest, getMatchById)
router.post("/", authenticateToken, requireAdminOrCoach, matchValidation, validateRequest, createMatch)
router.put("/:id", authenticateToken, requireAdminOrCoach, idValidation, validateRequest, updateMatch)
router.put(
  "/:id/score",
  authenticateToken,
  requireAdminOrCoach,
  idValidation,
  scoreValidation,
  validateRequest,
  updateMatchScore,
)
router.delete("/:id", authenticateToken, requireAdminOrCoach, idValidation, validateRequest, deleteMatch)

export default router
