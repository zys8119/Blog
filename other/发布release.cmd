chcp 65001
@ECHO off
set _pathForm=H:\work\nbrd_red_new\dist
set _path=H:\work\common_prod_rd
echo 请输入存放目标======================
echo 1:npc_pc_new_all
echo 2:npc_pc_new
set /p _dir=
if %_dir% == 1 set _dir=npc_pc_new_all
if %_dir% == 2 set _dir=npc_pc_new
goto :start
:start
cd %_path% && H: && rd /s/q %_dir%
md %_dir%
cd %_dir%
xcopy /s %_pathForm%
cd %_path%
git pull && git status
git add . && git status
set /p commit= 请输入commit:
git commit -m '%commit%'
echo 请输入提交分支branch======================
echo 1:release
echo 2:master
set /p branch=
if %branch% == 1 set branch=release
if %branch% == 2 set branch=master
goto :start1
:start1
git push origin %branch%
::pause>nul