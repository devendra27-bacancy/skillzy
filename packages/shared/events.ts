export enum SkillzySocketEvent {
  SessionJoin = "session:join",
  SessionTeacherJoin = "session:teacher_join",
  SessionState = "session:state",
  SessionEnd = "session:end",
  SessionEnded = "session:ended",
  SlideAdvance = "slide:advance",
  QuestionActive = "question:active",
  QuestionReveal = "question:reveal",
  QuestionRevealed = "question:revealed",
  ResponseSubmit = "response:submit",
  ResponseNew = "response:new",
  ParticipantJoined = "participant:joined",
  Error = "error"
}
