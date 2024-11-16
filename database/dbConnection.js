import mongoose from "mongoose";

export const dbConnection = () => {
  mongoose
    .connect('mongodb+srv://singhgurneesh2022:WVrP4X6WJ6s1Pyti@cluster0.8hftb.mongodb.net/chatbot?retryWrites=true&w=majority&appName=Cluster0', {
      dbName: "MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM",
    })
    .then(() => {
      console.log("Connected to database!");
    })
    .catch((err) => {
      console.log("Some error occured while connecting to database:", err);
    });
};
