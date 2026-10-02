package com.ruoyi.pm.mapper;

import java.util.List;
import com.ruoyi.pm.domain.PmProject;
import com.ruoyi.pm.domain.PmProjectVersion;

/**
 * 原型项目 数据层
 */
public interface PmProjectMapper
{
    public PmProject selectPmProjectById(Long id);

    public List<PmProject> selectPmProjectList(PmProject query);

    public int insertPmProject(PmProject project);

    public int updatePmProject(PmProject project);

    public int deletePmProjectById(Long id);

    public int deletePmProjectByIds(Long[] ids);

    public int insertPmProjectVersion(PmProjectVersion version);

    public List<PmProjectVersion> selectPmProjectVersions(Long projectId);
}
