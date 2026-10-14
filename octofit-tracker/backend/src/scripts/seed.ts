import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

async function upsertDemoTeam(name: string, mascot: string) {
  return Team.findOneAndUpdate(
    { name },
    { $set: { name, mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const previousUser = await User.findOne({ email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

async function upsertDemoActivity(userId: InstanceType<typeof User>['_id'], teamId: InstanceType<typeof Team>['_id'], type: string, minutes: number, occurredAt: Date) {
  const points = minutes;
  return Activity.findOneAndUpdate(
    { user: userId, team: teamId, type, occurredAt },
    { $set: { user: userId, team: teamId, type, minutes, points, occurredAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertDemoWorkout(title: string, focus: string, minutes: number, difficulty: string) {
  return Workout.findOneAndUpdate(
    { title },
    { $set: { title, focus, minutes, difficulty } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await upsertDemoTeam('Octocats', 'Mona');
    const robocats = await upsertDemoTeam('Robocats', 'Hubot');

    const mona = await upsertDemoUser('Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', 'hubot@example.com', robocats._id, 'strength');

    const monaRunAt = new Date('2026-01-10T12:00:00.000Z');
    const hubotCycleAt = new Date('2026-01-11T12:00:00.000Z');

    await upsertDemoActivity(mona._id, octocats._id, 'run', 40, monaRunAt);
    await upsertDemoActivity(hubot._id, robocats._id, 'cycle', 25, hubotCycleAt);
    await upsertDemoWorkout('Intervals', 'endurance', 30, 'moderate');
    await upsertDemoWorkout('Strength Circuit', 'strength', 30, 'moderate');

    await Team.updateOne({ _id: octocats._id }, { $addToSet: { members: mona._id } });
    await Team.updateOne({ _id: robocats._id }, { $addToSet: { members: hubot._id } });
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
