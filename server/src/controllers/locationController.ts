import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const getStates = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        _count: {
          select: { districts: true, properties: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { states },
    });
  } catch (error) {
    next(error);
  }
};

export const getDistricts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { stateId, stateCode } = req.query;

    const where: any = {};
    if (stateId) {
      where.stateId = String(stateId);
    } else if (stateCode) {
      const state = await prisma.state.findUnique({
        where: { code: String(stateCode).toUpperCase() },
      });
      if (state) {
        where.stateId = state.id;
      }
    }

    const districts = await prisma.district.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        stateId: true,
        name: true,
        headquarters: true,
        _count: {
          select: { subdistricts: true, properties: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { districts },
    });
  } catch (error) {
    next(error);
  }
};

export const getSubdistricts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { districtId } = req.query;

    if (!districtId) {
      res.status(400).json({
        success: false,
        message: 'districtId query parameter is required',
      });
      return;
    }

    const subdistricts = await prisma.subdistrict.findMany({
      where: { districtId: String(districtId) },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        districtId: true,
        name: true,
        _count: {
          select: { villages: true, properties: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { subdistricts },
    });
  } catch (error) {
    next(error);
  }
};

export const getVillages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subdistrictId, districtId } = req.query;

    const where: any = {};
    if (subdistrictId) {
      where.subdistrictId = String(subdistrictId);
    } else if (districtId) {
      where.subdistrict = { districtId: String(districtId) };
    } else {
      res.status(400).json({
        success: false,
        message: 'subdistrictId or districtId query parameter is required',
      });
      return;
    }

    const villages = await prisma.village.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        subdistrictId: true,
        name: true,
        isUrban: true,
        _count: {
          select: { properties: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { villages },
    });
  } catch (error) {
    next(error);
  }
};

export const searchLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = String(req.query.q || '').trim();

    if (query.length < 2) {
      res.status(200).json({
        success: true,
        data: { results: [] },
      });
      return;
    }

    // Parallel search across hierarchy levels
    const [villages, subdistricts, districts, states, pincodes] = await Promise.all([
      prisma.village.findMany({
        where: { name: { contains: query } },
        take: 8,
        include: {
          subdistrict: {
            include: {
              district: {
                include: { state: true },
              },
            },
          },
        },
      }),
      prisma.subdistrict.findMany({
        where: { name: { contains: query } },
        take: 6,
        include: {
          district: {
            include: { state: true },
          },
        },
      }),
      prisma.district.findMany({
        where: { name: { contains: query } },
        take: 6,
        include: { state: true },
      }),
      prisma.state.findMany({
        where: { name: { contains: query } },
        take: 4,
      }),
      prisma.pincodeDirectory.findMany({
        where: {
          OR: [
            { pincode: { startsWith: query } },
            { officeName: { contains: query } },
          ],
        },
        take: 6,
      }),
    ]);

    const results = [
      ...villages.map((v) => ({
        type: 'VILLAGE',
        id: v.id,
        name: v.name,
        breadcrumb: `${v.name}, ${v.subdistrict.name}, ${v.subdistrict.district.name}, ${v.subdistrict.district.state.name}`,
        stateId: v.subdistrict.district.state.id,
        stateName: v.subdistrict.district.state.name,
        districtId: v.subdistrict.district.id,
        districtName: v.subdistrict.district.name,
        subdistrictId: v.subdistrict.id,
        subdistrictName: v.subdistrict.name,
        villageId: v.id,
        villageName: v.name,
      })),
      ...subdistricts.map((s) => ({
        type: 'SUBDISTRICT',
        id: s.id,
        name: s.name,
        breadcrumb: `${s.name} (Taluka), ${s.district.name}, ${s.district.state.name}`,
        stateId: s.district.state.id,
        stateName: s.district.state.name,
        districtId: s.district.id,
        districtName: s.district.name,
        subdistrictId: s.id,
        subdistrictName: s.name,
      })),
      ...districts.map((d) => ({
        type: 'DISTRICT',
        id: d.id,
        name: d.name,
        breadcrumb: `${d.name} (District), ${d.state.name}`,
        stateId: d.state.id,
        stateName: d.state.name,
        districtId: d.id,
        districtName: d.name,
      })),
      ...states.map((st) => ({
        type: 'STATE',
        id: st.id,
        name: st.name,
        breadcrumb: `${st.name} (${st.type === 'UT' ? 'Union Territory' : 'State'})`,
        stateId: st.id,
        stateName: st.name,
      })),
      ...pincodes.map((p) => ({
        type: 'PINCODE',
        id: p.id,
        name: `${p.pincode} - ${p.officeName}`,
        breadcrumb: `${p.officeName} (${p.pincode}), ${p.taluk || ''}, ${p.districtName}, ${p.stateName}`,
        pincode: p.pincode,
        stateName: p.stateName,
        districtName: p.districtName,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    ];

    res.status(200).json({
      success: true,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};

export const lookupPincode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      res.status(400).json({
        success: false,
        message: 'A valid 6-digit Indian PIN code is required.',
      });
      return;
    }

    const matches = await prisma.pincodeDirectory.findMany({
      where: { pincode },
    });

    if (matches.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No directory records found for this PIN code.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { pincode, records: matches },
    });
  } catch (error) {
    next(error);
  }
};

export const importLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Array of location records expected: { stateCode, stateName, districtName, subdistrictName?, villageName? }',
      });
      return;
    }

    let inserted = 0;
    for (const rec of records) {
      if (!rec.stateCode || !rec.stateName || !rec.districtName) continue;

      const state = await prisma.state.upsert({
        where: { code: rec.stateCode.toUpperCase() },
        update: { name: rec.stateName },
        create: { code: rec.stateCode.toUpperCase(), name: rec.stateName },
      });

      const district = await prisma.district.upsert({
        where: {
          stateId_name: {
            stateId: state.id,
            name: rec.districtName,
          },
        },
        update: {},
        create: {
          stateId: state.id,
          name: rec.districtName,
        },
      });

      if (rec.subdistrictName) {
        const subdistrict = await prisma.subdistrict.upsert({
          where: {
            districtId_name: {
              districtId: district.id,
              name: rec.subdistrictName,
            },
          },
          update: {},
          create: {
            districtId: district.id,
            name: rec.subdistrictName,
          },
        });

        if (rec.villageName) {
          const villageExists = await prisma.village.findFirst({
            where: {
              subdistrictId: subdistrict.id,
              name: rec.villageName,
            },
          });

          if (!villageExists) {
            await prisma.village.create({
              data: {
                subdistrictId: subdistrict.id,
                name: rec.villageName,
                isUrban: rec.isUrban ?? false,
              },
            });
          }
        }
      }
      inserted++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${inserted} location records.`,
    });
  } catch (error) {
    next(error);
  }
};
