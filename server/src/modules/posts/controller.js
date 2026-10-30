// Controller posts
import asyncHandler from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import * as postService from "./service.js";

// GET /api/admin/posts?page=&search=&status=&categoryId=
export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await postService.listPosts(req.query);
  sendSuccess(res, { data, meta });
});

export const detail = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await postService.getPost(req.params.id) });
});

// POST — penulis diambil dari user login
export const create = asyncHandler(async (req, res) => {
  const post = await postService.createPost({ ...req.body, authorId: req.user.id });
  sendSuccess(res, { data: post, status: 201 });
});

export const update = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.params.id, req.body);
  sendSuccess(res, { data: post });
});

export const remove = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await postService.deletePost(req.params.id) });
});

// PATCH /:id/publish — toggle draft/terbit
export const publish = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await postService.togglePublish(req.params.id) });
});
