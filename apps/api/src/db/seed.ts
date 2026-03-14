import { skillzyStore } from "../services/store";

export async function seedDevelopmentData() {
  await skillzyStore.listDashboard();
  return {
    success: true,
    message: "Development seed is available through the current store bootstrap."
  };
}

if (require.main === module) {
  seedDevelopmentData()
    .then((result) => {
      console.log(result.message);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
