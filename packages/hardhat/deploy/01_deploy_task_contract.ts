import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTaskContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 먼저 TaskToken 배포
  const taskTokenDeployment = await deploy("TaskToken", {
    from: deployer,
    args: [deployer], // 초기 소유자 설정
    log: true,
    autoMine: true,
  });

  console.log("TaskToken이 배포되었습니다:", taskTokenDeployment.address);

  // TaskContract 배포 (TaskToken 주소를 인자로 전달)
  const taskContractDeployment = await deploy("TaskContract", {
    from: deployer,
    args: [taskTokenDeployment.address], // 토큰 컨트랙트 주소 전달
    log: true,
    autoMine: true,
  });

  const taskContract = await hre.ethers.getContract("TaskContract", deployer);
  console.log("TaskContract이 배포되었습니다:", await taskContract.getAddress());

  // TaskToken에 TaskContract 주소 설정 (보상 권한 부여)
  const taskToken = await hre.ethers.getContract("TaskToken", deployer);
  await (taskToken as any).setTaskContract(taskContractDeployment.address);
  console.log("TaskToken에 TaskContract 권한이 부여되었습니다");
};

export default deployTaskContract;

deployTaskContract.tags = ["TaskContract"];