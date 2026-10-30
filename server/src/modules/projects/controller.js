// Controller projects
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as projectService from "./service.js";

// GET /api/admin/projects?page=&limit=&search=&status=&categoryId=
export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await projectService.listProjects(req.query);
  sendSuccess(res, { data, meta });
});

// GET /api/admin/projects/:id
export const detail = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.params.id);
  sendSuccess(res, { data: project });
});

// POST /api/admin/projects
export const create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body);
  sendSuccess(res, { data: project, status: 201 });
});

// PUT /api/admin/projects/:id
export const update = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  sendSuccess(res, { data: project });
});

// DELETE /api/admin/projects/:id
export const remove = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject(req.params.id);
  sendSuccess(res, { data: result });
});

// PATCH /api/admin/projects/:id/publish — toggle isPublished
export const publish = asyncHandler(async (req, res) => {
  const project = await projectService.togglePublish(req.params.id);
  sendSuccess(res, { data: project });
});

// PATCH /api/admin/projects/:id/featured — toggle isFeatured
export const featured = asyncHandler(async (req, res) => {
  const project = await projectService.toggleFeatured(req.params.id);
  sendSuccess(res, { data: project });
});
