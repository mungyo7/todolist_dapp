import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTaskToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("TaskToken", {
    from: deployer,
    args: [deployer], // 초기 소유자 설정
    log: true,
    autoMine: true,
  });

  const taskToken = await hre.ethers.getContract("TaskToken", deployer);
  console.log("TaskToken이 배포되었습니다:", await taskToken.getAddress());
};

export default deployTaskToken;

deployTaskToken.tags = ["TaskToken"];