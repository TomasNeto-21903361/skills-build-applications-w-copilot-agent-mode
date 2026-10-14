import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function HttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw HttpError('Activity payload is required', 400);
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    throw HttpError('A valid userId is required', 400);
  }
  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw HttpError('A valid teamId is required', 400);
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw HttpError('Activity type is required', 400);
  }
  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    throw HttpError('Minutes must be a positive number', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw HttpError('User not found', 404);
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw HttpError('Team not found', 404);
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes: parsedMinutes,
    points: parsedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw HttpError('Team payload is required', 400);
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) {
    throw HttpError('Team name is required', 400);
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw HttpError('Team mascot is required', 400);
  }

  const normalizedMembers = Array.isArray(members) ? members : [];
  const memberIds = normalizedMembers.map((member) => {
    if (typeof member === 'string') {
      if (!mongoose.Types.ObjectId.isValid(member)) {
        throw HttpError('Team members must contain valid ObjectIds', 400);
      }
      return new mongoose.Types.ObjectId(member);
    }

    if (member && typeof member === 'object' && '_id' in member && member._id) {
      const memberId = String(member._id);
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw HttpError('Team members must contain valid ObjectIds', 400);
      }
      return new mongoose.Types.ObjectId(memberId);
    }

    throw HttpError('Team members must contain valid ObjectIds', 400);
  });

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const teamTotals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const leaderboard = await Promise.all(
    teamTotals.map(async (entry, index) => {
      const team = await Team.findById(entry._id).lean();
      if (!team) {
        return null;
      }
      return {
        teamName: team.name,
        totalPoints: Number(entry.totalPoints),
        rank: index + 1,
      };
    }),
  );

  return leaderboard.filter((entry): entry is { teamName: string; totalPoints: number; rank: number } => entry !== null);
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail?.trim();
  if (!normalizedEmail) {
    throw HttpError('User email is required', 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw HttpError('User not found', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const preferredFocus = typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim()
    ? user.fitnessGoal.trim().toLowerCase()
    : recentActivities[0]?.type?.toLowerCase() ?? '';

  let workouts = await Workout.find().lean();
  if (preferredFocus) {
    workouts = workouts.filter((workout) => (workout.focus ?? '').toLowerCase() === preferredFocus);
  }

  if (!workouts.length && recentActivities.length > 0) {
    const recentType = String(recentActivities[0].type ?? '').toLowerCase();
    workouts = await Workout.find({ focus: recentType }).lean();
  }

  if (!workouts.length) {
    workouts = await Workout.find().lean();
  }

  const recentType = recentActivities[0]?.type ?? 'activity';
  const suggestionReasonBase = user.fitnessGoal && typeof user.fitnessGoal === 'string'
    ? `Matches your ${user.fitnessGoal} goal and recent ${recentType} activity.`
    : `Matches your recent ${recentType} activity pattern.`;

  return workouts.slice(0, 3).map((workout) => ({
    ...workout,
    reason: `${suggestionReasonBase} ${workout.title} focuses on ${workout.focus}.`,
  }));
}

export { User };
