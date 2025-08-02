import type { Request, Response } from "express"
import { prisma } from "../config/database"
import { success, created, notFound, badRequest } from "../utils/apiResponse"

export const createMatch = async (req: Request, res: Response) => {
  const { date, time, venue, homeTeam, awayTeam, tournamentId, groupId } = req.body

  try {
    // Validate that teams are different
    if (homeTeam === awayTeam) {
      return badRequest(res, "Une équipe ne peut pas jouer contre elle-même")
    }

    // Verify teams exist
    const homeTeamExists = await prisma.team.findFirst({
      where: {
        id: homeTeam,
        tenantId: req.user?.tenantId,
      },
    })

    const awayTeamExists = await prisma.team.findFirst({
      where: {
        id: awayTeam,
        tenantId: req.user?.tenantId,
      },
    })

    if (!homeTeamExists || !awayTeamExists) {
      return badRequest(res, "Une ou plusieurs équipes n'existent pas")
    }

    // Verify tournament exists
    const tournament = await prisma.tournament.findFirst({
      where: {
        id: tournamentId,
        tenantId: req.user?.tenantId,
      },
    })

    if (!tournament) {
      return notFound(res, "Tournoi non trouvé")
    }

    // Verify group exists if provided
    if (groupId) {
      const group = await prisma.group.findFirst({
        where: {
          id: groupId,
          tournamentId: tournamentId,
          tenantId: req.user?.tenantId,
        },
      })

      if (!group) {
        return notFound(res, "Groupe non trouvé")
      }
    }

    const match = await prisma.match.create({
      data: {
        date,
        time,
        venue,
        homeTeam,
        awayTeam,
        tournamentId,
        groupId,
        status: "scheduled",
        tenantId: req.user?.tenantId,
      },
      include: {
        homeTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        awayTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return created(res, match, "Match créé avec succès")
  } catch (error) {
    console.error("Erreur création match:", error)
    return badRequest(res, "Erreur lors de la création du match")
  }
}

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { tournamentId, groupId, status, date } = req.query

    const whereClause: any = {}

    if (tournamentId) {
      whereClause.tournamentId = tournamentId as string
    }

    if (groupId) {
      whereClause.groupId = groupId as string
    }

    if (status) {
      whereClause.status = status as string
    }

    if (date) {
      whereClause.date = date as string
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        homeTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        awayTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    })

    return success(res, matches)
  } catch (error) {
    console.error("Erreur récupération matchs:", error)
    return badRequest(res, "Erreur lors de la récupération des matchs")
  }
}

export const getMatchById = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const match = await prisma.match.findUnique({
      where: {
        id: id,
        tenantId: req.user?.tenantId,
      },
      include: {
        homeTeamRef: {
          include: {
            playerRecords: true,
          },
        },
        awayTeamRef: {
          include: {
            playerRecords: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!match) {
      return notFound(res, "Match non trouvé")
    }

    return success(res, match)
  } catch (error) {
    console.error("Erreur récupération match:", error)
    return badRequest(res, "Erreur lors de la récupération du match")
  }
}

export const updateMatch = async (req: Request, res: Response) => {
  const { id } = req.params
  const { date, time, venue, status } = req.body

  try {
    const updateData: any = {}
    if (date) updateData.date = date
    if (time) updateData.time = time
    if (venue) updateData.venue = venue
    if (status) updateData.status = status

    // Pour les admins, permettre la mise à jour de tous les matchs
    const whereClause = req.user?.role === 'admin' 
      ? { id: id }
      : { id: id, tenantId: req.user?.tenantId }

    const match = await prisma.match.update({
      where: whereClause,
      data: updateData,
      include: {
        homeTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        awayTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    })

    return success(res, match, "Match mis à jour avec succès")
  } catch (error) {
    console.error("Erreur mise à jour match:", error)
    return badRequest(res, "Erreur lors de la mise à jour du match")
  }
}

export const updateMatchScore = async (req: Request, res: Response) => {
  const { id } = req.params
  const { homeScore, awayScore, status } = req.body

  try {
    // Pour les admins, permettre la consultation de tous les matchs
    const whereClause = req.user?.role === 'admin' 
      ? { id: id }
      : { id: id, tenantId: req.user?.tenantId }

    const match = await prisma.match.findUnique({
      where: whereClause,
      include: {
        homeTeamRef: true,
        awayTeamRef: true,
        group: true,
      },
    })

    if (!match) {
      return notFound(res, "Match non trouvé")
    }

    // Update match score
    const updatedMatch = await prisma.match.update({
      where: { id: id },
      data: {
        homeScore: Number.parseInt(homeScore),
        awayScore: Number.parseInt(awayScore),
        status: status || "completed",
      },
      include: {
        homeTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        awayTeamRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    })

    // Update team statistics
    const homeScoreInt = Number.parseInt(homeScore)
    const awayScoreInt = Number.parseInt(awayScore)

    // Update home team stats
    const homeTeamUpdate: any = {
      matchesPlayed: { increment: 1 },
      goalsScored: { increment: homeScoreInt },
    }

    // Update away team stats
    const awayTeamUpdate: any = {
      matchesPlayed: { increment: 1 },
      goalsScored: { increment: awayScoreInt },
    }

    // Determine winner and update wins/draws/losses
    if (homeScoreInt > awayScoreInt) {
      homeTeamUpdate.wins = { increment: 1 }
      awayTeamUpdate.losses = { increment: 1 }
    } else if (homeScoreInt < awayScoreInt) {
      homeTeamUpdate.losses = { increment: 1 }
      awayTeamUpdate.wins = { increment: 1 }
    } else {
      homeTeamUpdate.draws = { increment: 1 }
      awayTeamUpdate.draws = { increment: 1 }
    }

    // Update team statistics
    if (match.homeTeam && match.awayTeam) {
      await Promise.all([
        prisma.team.update({
          where: { id: match.homeTeam },
          data: homeTeamUpdate,
        }),
        prisma.team.update({
          where: { id: match.awayTeam },
          data: awayTeamUpdate,
        }),
      ])
    }

    // Update group team statistics if match is in a group
    if (match.groupId && match.homeTeam && match.awayTeam) {
      const homeGroupTeam = await prisma.groupTeam.findFirst({
        where: {
          groupId: match.groupId,
          teamId: match.homeTeam,
        },
      })

      const awayGroupTeam = await prisma.groupTeam.findFirst({
        where: {
          groupId: match.groupId,
          teamId: match.awayTeam,
        },
      })

      if (homeGroupTeam && awayGroupTeam) {
        // Update home group team
        const homeGroupUpdate: any = {
          played: { increment: 1 },
          goalsFor: { increment: homeScoreInt },
          goalsAgainst: { increment: awayScoreInt },
        }

        // Update away group team
        const awayGroupUpdate: any = {
          played: { increment: 1 },
          goalsFor: { increment: awayScoreInt },
          goalsAgainst: { increment: homeScoreInt },
        }

        // Points calculation (3 for win, 1 for draw, 0 for loss)
        if (homeScoreInt > awayScoreInt) {
          homeGroupUpdate.wins = { increment: 1 }
          homeGroupUpdate.points = { increment: 3 }
          awayGroupUpdate.losses = { increment: 1 }
        } else if (homeScoreInt < awayScoreInt) {
          homeGroupUpdate.losses = { increment: 1 }
          awayGroupUpdate.wins = { increment: 1 }
          awayGroupUpdate.points = { increment: 3 }
        } else {
          homeGroupUpdate.draws = { increment: 1 }
          homeGroupUpdate.points = { increment: 1 }
          awayGroupUpdate.draws = { increment: 1 }
          awayGroupUpdate.points = { increment: 1 }
        }

        await Promise.all([
          prisma.groupTeam.update({
            where: { id: homeGroupTeam.id },
            data: homeGroupUpdate,
          }),
          prisma.groupTeam.update({
            where: { id: awayGroupTeam.id },
            data: awayGroupUpdate,
          }),
        ])
      }
    }

    return success(res, updatedMatch, "Score du match mis à jour avec succès")
  } catch (error) {
    console.error("Erreur mise à jour score:", error)
    return badRequest(res, "Erreur lors de la mise à jour du score")
  }
}

export const deleteMatch = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const match = await prisma.match.findUnique({
      where: {
        id: id,
        tenantId: req.user?.tenantId,
      },
    })

    if (!match) {
      return notFound(res, "Match non trouvé")
    }

    if (match.status === "completed") {
      return badRequest(res, "Impossible de supprimer un match terminé")
    }

    await prisma.match.delete({
      where: { id: id },
    })

    return success(res, null, "Match supprimé avec succès")
  } catch (error) {
    console.error("Erreur suppression match:", error)
    return badRequest(res, "Erreur lors de la suppression du match")
  }
}
