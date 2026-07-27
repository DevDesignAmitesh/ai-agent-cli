// import { sandboxManager } from "./manager/sandbox.manager";
// import { projectRoot, sanboxRoot } from "./utils/tool.utils";

// import Sandbox from "e2b";

// await sandboxManager.uploadDirectory("1-2-3", projectRoot, sanboxRoot)
//   .then(() => process.exit(0));

// await sandboxManager.getSandbox("1-2-3")
//   .then(() => process.exit(0));

// const sbx = await Sandbox.create("ibqh4t2yph4w1q3rm4or8")
//   await sbx.kill()



















// // index.ts
// import express from "express"
// import { todoRouter } from "./routes/todo.router"

// const app = express();

// app.use(express.json())

// app.post("/signin", signin)
// app.post("/register", register)

// app.use("/api/v1/todo", todoRouter)


// app.listen(PORT, () => console.log("code is running at", PORT))










// // todo.router.ts
// import { Router } from "express"

// const todoRouter = Router();

// todoRouter.get("/todos", auth, getTodo)
// todoRouter.post("/todos", auth, createTodo)
// todoRouter.put("/todos/:todoId", auth, updateTodo)
// todoRouter.delete("/todos/:todoId", auth, deleteTodo)








// // auth.middleware.ts
// import type { Request, Response, NextFunction } from "express";
// import { verify } from "jwt";

// export function auth(req: Request, res: Response, next: NextFunction) {
//   const bearerToken = req.headers.authorization;

//   if (!bearerToken || !bearerToken.includes("Bearer ")) {
//     res.status(401).json({ message: "bearer token not found" });
//     return;
//   }
  
//   // null or payload
//   const verfiedToken = verify(bearerToken, "secret");
  
//   if (!verfiedToken) {
//     res.status(401).json({ message: "token expired" });
//     return;
//   }
  
//   req.userId = verfiedToken.userId;
//   next();
// }







