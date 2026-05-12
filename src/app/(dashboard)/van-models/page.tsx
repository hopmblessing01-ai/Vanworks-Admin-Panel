import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Van Models — Vanworks" };
export const dynamic = "force-dynamic";

export default async function VanModelsPage() {
  const supabase = createClient();
  const { data: models } = await supabase
    .from("van_models")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Van Models
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse, create and update your van model catalog.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/van-models/new"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
        >
          New Model
        </Button>
      </Box>

      {!models || models.length === 0 ? (
        <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
          <CardContent>
            <Stack
              spacing={1.5}
              sx={{
                py: 6,
                textAlign: "center",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.04)",
                  color: "text.secondary",
                }}
              >
                <LocalShippingIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6">No van models yet</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 360 }}
              >
                Create your first van model to start building sales and build
                forms.
              </Typography>
              <Button
                component={Link}
                href="/van-models/new"
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                sx={{ mt: 1 }}
              >
                Create model
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {models.map((m) => (
            <Grid key={m.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <Card
                component={Link}
                href={`/van-models/${m.id}`}
                sx={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  overflow: "hidden",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                    borderColor: "primary.main",
                  },
                  "&:hover .van-image": { transform: "scale(1.03)" },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    width: "100%",
                    overflow: "hidden",
                    backgroundColor: "rgba(0,0,0,0.04)",
                  }}
                >
                  {m.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={m.image_url}
                      alt={m.name}
                      className="van-image"
                      style={{
                        height: "100%",
                        width: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%",
                        color: "text.secondary",
                      }}
                    >
                      <LocalShippingIcon sx={{ fontSize: 40 }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Base price{" "}
                    <Box
                      component="span"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      {formatCurrency(m.price)}
                    </Box>
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
