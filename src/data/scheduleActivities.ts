import { ScheduleActivities } from '../types/schedule'

export const scheduleActivities: ScheduleActivities = {
  "06:00": { 
    activity: "Wake up",
    actions: [{
      type: "alarm",
      message: "Good morning! Time to start your day."
    }]
  },
  "06:30": { 
    activity: "Exercise",
    duration: 60,
    actions: [
      {
        type: "reminder",
        message: "Start your workout.",
        channels: ["text"]
      },
      {
        type: "api_call",
        service: "fitness_app",
        action: "start_workout_tracking",
        message: "Starting workout tracking"
      }
    ]
  },
  "07:30": {
    activity: "Breakfast",
    duration: 30,
    actions: [{
      type: "reminder",
      message: "Time for a nutritious breakfast",
      channels: ["text"]
    }]
  },
  "08:00": {
    activity: "Focus Work - Dynamic Momentum",
    duration: 240,
    tag: "focus_dynamic",
    slots: [
      { description: "Identify bottlenecks" },
      { description: "List All Current Tasks" },
      { description: "Time Blocking: Effort vs. Impact High-To-Low-Priority Tasks" },
      { description: "Continuous Improvement:" },
      { description: "Documentation" },
      { description: "" },
      { description: "" },
      { description: "" }
    ],
    actions: [
      {
        type: "distraction_block",
        mode: "enable",
        message: "Enabling distraction blocking"
      },
      {
        type: "status_update",
        message: "Entering deep work session for Dynamic Momentum.",
        channels: ["status_board"]
      }
    ]
  },
  "12:00": {
    activity: "Lunch Break",
    duration: 30,
    actions: [{
      type: "reminder",
      message: "Time for lunch - take a proper break",
      channels: ["text"]
    }]
  },
  "12:30": {
    activity: "Short Walk/Mindfulness",
    duration: 30,
    actions: [
      {
        type: "reminder",
        message: "Time for walk and meditation",
        channels: ["text"]
      },
      {
        type: "api_call",
        service: "mindfulness_app",
        action: "start_session",
        message: "Starting mindfulness session"
      }
    ]
  },
  "13:00": {
    activity: "Focus Work - Motion Storyline",
    duration: 240,
    tag: "focus_motion",
    slots: [
      { description: "Identify bottlenecks" },
      { description: "List All Current Tasks" },
      { description: "Time Blocking: Effort vs. Impact High-To-Low-Priority Tasks" },
      { description: "Continuous Improvement:" },
      { description: "Documentation" },
      { description: "" },
      { description: "" },
      { description: "" }
    ],
    actions: [
      {
        type: "distraction_block",
        mode: "enable",
        message: "Enabling distraction blocking"
      },
      {
        type: "status_update",
        message: "Entering deep work session for Motion Storyline.",
        channels: ["status_board"]
      }
    ]
  },
  "17:00": {
    activity: "Break",
    duration: 30,
    actions: [{
      type: "reminder",
      message: "Take a break - snack and hydration",
      channels: ["text"]
    }]
  },
  "17:30": {
    activity: "Task Management & Meetings",
    duration: 120,
    actions: [{
      type: "reminder",
      message: "Starting task management and meetings block",
      channels: ["text"]
    }]
  },
  "19:30": {
    activity: "Dinner",
    duration: 30,
    actions: [{
      type: "reminder",
      message: "Time for dinner",
      channels: ["text"]
    }]
  },
  "20:00": {
    activity: "Learning/Skill Improvement",
    duration: 90,
    actions: [{
      type: "reminder",
      message: "Time for learning and skill improvement",
      channels: ["text"]
    }]
  },
  "21:30": {
    activity: "Wind Down",
    duration: 30,
    actions: [{
      type: "reminder",
      message: "Start winding down - journaling and light reading",
      channels: ["text"]
    }]
  },
  "22:00": {
    activity: "Sleep",
    actions: [
      {
        type: "reminder",
        message: "Time to sleep - good night!",
        channels: ["text"]
      },
      {
        type: "api_call",
        service: "smart_home",
        action: "night_mode",
        message: "Enabling night mode"
      }
    ]
  }
} 