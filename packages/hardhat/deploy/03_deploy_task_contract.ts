import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTaskContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // TaskToken 컨트랙트 주소 가져오기
  const taskToken = await hre.ethers.getContract("TaskToken", deployer);
  const taskTokenAddress = await taskToken.getAddress();

  // TaskContract 배포
  await deploy("TaskContract", {
    from: deployer,
    args: [taskTokenAddress], // 토큰 컨트랙트 주소 전달
    log: true,
    autoMine: true,
  });

  const taskContract = await hre.ethers.getContract("TaskContract", deployer);
  const taskContractAddress = await taskContract.getAddress();
  
  console.log("TaskContract이 배포되었습니다:", taskContractAddress);
  
  // TaskToken에 TaskContract 주소 설정 (보상 권한 부여)
  await (taskToken as any).setTaskContract(taskContractAddress);
  console.log("TaskToken에 TaskContract 권한이 부여되었습니다");
};

export default deployTaskContract;

deployTaskContract.tags = ["TaskContract"];
deployTaskContract.dependencies = ["TaskToken"]; // TaskToken 먼저 배포 필요