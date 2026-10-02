package com.ruoyi.pm.service;

import java.util.List;
import com.ruoyi.pm.domain.PmProject;

/**
 * 原型项目 服务层
 */
public interface IPmProjectService
{
    public List<PmProject> selectPmProjectList(PmProject query);

    public PmProject selectPmProjectById(Long id);

    public int insertPmProject(PmProject project);

    public int updatePmProject(PmProject project);

    public int deletePmProjectByIds(Long[] ids);

    public int deletePmProjectById(Long id);
}
