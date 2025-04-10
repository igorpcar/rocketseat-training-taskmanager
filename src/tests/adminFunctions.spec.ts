import { app } from "@/app"
import request from "supertest"
import { prisma } from "@/database/prisma"

describe("Test admin functions", () => {

  const adminUser = { email: 'admin@email.com', password: '123456'}
  const user = { email: 'test@email.com', name: 'test', password: '123456', id: ''}
  const team = { name: '_test', description: 'test', id: ''}
  const task = { title: '_task', description: 'description', status: 'pending', priority: 'high', team_id: '', user_id: '', id: ''}
  let token: string

  afterAll(async () => {
  
    const taskId = (await prisma.task.findFirst({select: {id: true}, where: {title: task.title}}))?.id
    if (taskId) await prisma.task.delete({where: {id: taskId}}) 
    
    const teamMemberId = (await prisma.teamMember.findFirst({select: {id: true}, where: {user_id: user.id}}))?.id
    if (teamMemberId) await prisma.teamMember.delete({where: {id: teamMemberId}})

    const userId = (await prisma.user.findFirst({select: {id: true}, where: {id: user.id}}))?.id
    if (userId) await prisma.user.delete({where: {id: userId}}) 

    const teamId = (await prisma.team.findFirst({select: {id: true}, where: {id: team.id}}))?.id
    if (teamId) await prisma.team.delete({where: {id: teamId}}) 

  })

  it("creates sessions and gets token", async () => {

    const response = await request(app)
      .post('/sessions')
      .send({  email: adminUser.email, password: adminUser.password})

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')

    token = response.body.token

  })

  it("creates a user", async () => {
    const response = await request(app)
    .post('/users')
    .send({ name: user.name, email: user.email, password: user.password })
    .set("Authorization", `Bearer ${token}`)

    expect(response.body).toHaveProperty('id')
    user.id = response.body.id
    expect(response.status).toBe(201)
    expect(response.body.email).toBe(user.email)

  })

  it("can't create same user", async () => {
    const response = await request(app)
    .post('/users')
    .send({ name: user.name, email: user.email, password: user.password })
    .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(400)
  })

  it("creates a team", async () => {
    const response = await request(app)
    .post('/teams')
    .send({ name: team.name, description: team.description })
    .set("Authorization", `Bearer ${token}`)

    expect(response.body).toHaveProperty('id')
    team.id = response.body.id
    expect(response.status).toBe(201)

  })

  it("assigns user to a team", async () => {
    const response = await request(app)
    .post(`/teams/${team.id}/member`)
    .send({ user_id: user.id })
    .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
  })

  it("creates a task and assigns to team and user", async () => {
    const response = await request(app)
    .post('/tasks')
    .send({ ...task, team_id: team.id, user_id: user.id })
    .set("Authorization", `Bearer ${token}`)

    expect(response.body).toHaveProperty('id')
    task.id = response.body.id
    expect(response.status).toBe(201)
    
  })

  it("deletes task, user and team", async () => {
    const taskResponse = await request(app)
    .delete(`/tasks/${task.id}`)
    .set("Authorization", `Bearer ${token}`)

    const userResponse = await request(app)
    .delete(`/users/${user.id}`)
    .set("Authorization", `Bearer ${token}`)

    const teamResponse = await request(app)
    .delete(`/teams/${team.id}`)
    .set("Authorization", `Bearer ${token}`)

    expect(taskResponse.status).toBe(200)
    expect(userResponse.status).toBe(200)
    expect(teamResponse.status).toBe(200)
  })
})